import { kv } from '@vercel/kv';
import { getRandomCharacters } from '../../utils/helpers.js';
import { uniqueCharacters } from '../../data/characterData.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Verifica se os mixes precisam ser atualizados
        const lastUpdate = await kv.get('last_mix_update');
        const now = new Date();
        
        // Se não houver timestamp ou se for um novo dia à meia-noite
        if (!lastUpdate || (now.getHours() === 0 && now.getMinutes() === 0 && now.getDate() !== new Date(lastUpdate).getDate())) {
            console.log('--- Iniciando atualização dos Mixes ---');

            // Verifica se o KV está inicializado
            if (!kv) {
                throw new Error('KV store não está inicializado');
            }

            const numCharsPerMix = 50;
            
            // Verifica se temos personagens suficientes
            if (!uniqueCharacters || uniqueCharacters.length < numCharsPerMix) {
                throw new Error(`Não há personagens suficientes. Necessário: ${numCharsPerMix}, Disponível: ${uniqueCharacters?.length || 0}`);
            }

            console.log(`Gerando ${numCharsPerMix} personagens para cada mix...`);
            
            // Gera os mixes
            const mix1Chars = getRandomCharacters(uniqueCharacters, numCharsPerMix);
            const mix2Chars = getRandomCharacters(uniqueCharacters, numCharsPerMix);
            const mix3Chars = getRandomCharacters(uniqueCharacters, numCharsPerMix);

            // Prepara os dados para salvar
            const mix1Data = mix1Chars.map(char => ({
                name: char.name,
                image: char.image
            }));
            const mix2Data = mix2Chars.map(char => ({
                name: char.name,
                image: char.image
            }));
            const mix3Data = mix3Chars.map(char => ({
                name: char.name,
                image: char.image
            }));

            // Salva os mixes no KV
            await kv.set('mix1_characters', mix1Data);
            await kv.set('mix2_characters', mix2Data);
            await kv.set('mix3_characters', mix3Data);

            // Atualiza o timestamp
            const currentTime = Date.now();
            await kv.set('last_mix_update', currentTime);
            
            console.log('Mixes atualizados com sucesso!');
            
            return res.status(200).json({
                message: 'Mixes atualizados com sucesso',
                timestamp: currentTime
            });
        }
        
        return res.status(200).json({
            message: 'Mixes já estão atualizados',
            timestamp: lastUpdate
        });
    } catch (error) {
        console.error('Erro ao atualizar mixes:', error);
        return res.status(500).json({
            message: 'Erro ao atualizar mixes',
            error: error.message
        });
    }
} 