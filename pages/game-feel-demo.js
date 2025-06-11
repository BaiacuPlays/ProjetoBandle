// 🎮 Página de demonstração dos efeitos de game feel
import React, { useState, useRef } from 'react';
import Head from 'next/head';
import { useGameFeel } from '../hooks/useGameFeel';
import EnhancedButton, { AttemptButton, InputButton } from '../components/EnhancedButton';
import EnhancedInput from '../components/EnhancedInput';
import styles from '../styles/GameFeelDemo.module.css';

export default function GameFeelDemo() {
  const gameFeel = useGameFeel();
  const [inputValue, setInputValue] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const demoRef = useRef(null);

  const handleShakeDemo = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleScreenShake = () => {
    gameFeel.effects.screenShake(document.body, 8, 400);
  };

  const handleParticleBurst = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    gameFeel.effects.particleBurst(x, y, '#FFD700', 15);
  };

  const handleRippleEffect = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    gameFeel.effects.rippleEffect(e.target, x, y, 'rgba(29, 185, 84, 0.4)');
  };

  const handleGlowEffect = (e) => {
    gameFeel.effects.glowEffect(e.target, '#1DB954', 1500);
  };

  const handlePulseEffect = (e) => {
    gameFeel.effects.pulseEffect(e.target, 1.2, 300);
  };

  const handleFloatUpEffect = (e) => {
    gameFeel.effects.floatUpEffect(e.target, 30, 600);
  };

  const handleBounceEffect = (e) => {
    gameFeel.effects.bounceEffect(e.target, 0.2, 400);
  };

  const handleColorFlash = (e) => {
    gameFeel.effects.colorFlash(e.target, '#FF6B6B', 300);
  };

  return (
    <>
      <Head>
        <title>Game Feel Demo - LudoMusic</title>
        <meta name="description" content="Demonstração dos efeitos de game feel do LudoMusic" />
      </Head>

      <div className={styles.container} ref={demoRef}>
        <div className={styles.header}>
          <h1 className={styles.title}>🎮 Game Feel Demo</h1>
          <p className={styles.subtitle}>
            Teste todos os efeitos visuais, sonoros e táteis implementados no LudoMusic
          </p>
        </div>

        <div className={styles.grid}>
          {/* Seção de Botões Aprimorados */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🔘 Botões Aprimorados</h2>
            <div className={styles.buttonGrid}>
              <EnhancedButton variant="primary" onClick={gameFeel.onClick}>
                Primary Button
              </EnhancedButton>
              <EnhancedButton variant="secondary" onClick={gameFeel.onClick}>
                Secondary Button
              </EnhancedButton>
              <EnhancedButton variant="success" onClick={gameFeel.onSuccess}>
                Success Button
              </EnhancedButton>
              <EnhancedButton variant="error" onClick={gameFeel.onError}>
                Error Button
              </EnhancedButton>
              <EnhancedButton variant="warning" onClick={gameFeel.onClick}>
                Warning Button
              </EnhancedButton>
              <EnhancedButton variant="primary" loading={true}>
                Loading Button
              </EnhancedButton>
            </div>
          </div>

          {/* Seção de Botões de Tentativa */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🎯 Botões de Tentativa</h2>
            <div className={styles.attemptGrid}>
              <AttemptButton attempt={1} status="success" tooltip="Acertou na primeira!" />
              <AttemptButton attempt={2} status="game" tooltip="Jogo correto" />
              <AttemptButton attempt={3} status="franchise" tooltip="Franquia correta" />
              <AttemptButton attempt={4} status="fail" tooltip="Errou" />
              <AttemptButton attempt={5} status="default" tooltip="Não jogado" />
              <AttemptButton attempt={6} status="disabled" tooltip="Desabilitado" />
            </div>
          </div>

          {/* Seção de Input Aprimorado */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📝 Input Aprimorado</h2>
            <div className={styles.inputDemo}>
              <EnhancedInput
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite algo para testar..."
                onFocus={gameFeel.onFocus}
                onBlur={gameFeel.onBlur}
              />
              <InputButton
                onClick={gameFeel.onClick}
                isShaking={isShaking}
              >
                Testar Input
              </InputButton>
            </div>
          </div>

          {/* Seção de Efeitos Visuais */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>✨ Efeitos Visuais</h2>
            <div className={styles.effectGrid}>
              <button className={styles.effectButton} onClick={handleScreenShake}>
                Screen Shake
              </button>
              <button className={styles.effectButton} onClick={handleParticleBurst}>
                Particle Burst
              </button>
              <button className={styles.effectButton} onClick={handleRippleEffect}>
                Ripple Effect
              </button>
              <button className={styles.effectButton} onClick={handleGlowEffect}>
                Glow Effect
              </button>
              <button className={styles.effectButton} onClick={handlePulseEffect}>
                Pulse Effect
              </button>
              <button className={styles.effectButton} onClick={handleFloatUpEffect}>
                Float Up Effect
              </button>
              <button className={styles.effectButton} onClick={handleBounceEffect}>
                Bounce Effect
              </button>
              <button className={styles.effectButton} onClick={handleColorFlash}>
                Color Flash
              </button>
            </div>
          </div>

          {/* Seção de Efeitos Sonoros */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🔊 Efeitos Sonoros</h2>
            <div className={styles.soundGrid}>
              <button className={styles.soundButton} onClick={gameFeel.onHover}>
                Hover Sound
              </button>
              <button className={styles.soundButton} onClick={gameFeel.onClick}>
                Click Sound
              </button>
              <button className={styles.soundButton} onClick={gameFeel.onError}>
                Error Sound
              </button>
              <button className={styles.soundButton} onClick={gameFeel.onSuccess}>
                Success Sound
              </button>
              <button className={styles.soundButton} onClick={gameFeel.onPerfect}>
                Perfect Sound
              </button>
              <button className={styles.soundButton} onClick={gameFeel.onSkip}>
                Skip Sound
              </button>
              <button className={styles.soundButton} onClick={gameFeel.onNotification}>
                Notification Sound
              </button>
              <button className={styles.soundButton} onClick={gameFeel.onTyping}>
                Typing Sound
              </button>
            </div>
          </div>

          {/* Seção de Feedback Combinado */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🎊 Feedback Combinado</h2>
            <div className={styles.comboGrid}>
              <EnhancedButton 
                variant="success" 
                size="large"
                onClick={(e) => {
                  gameFeel.onSuccess(e.target);
                  handleParticleBurst(e);
                }}
              >
                🎉 Sucesso Completo
              </EnhancedButton>
              <EnhancedButton 
                variant="error" 
                size="large"
                onClick={(e) => {
                  gameFeel.onError(e.target);
                  handleShakeDemo();
                }}
              >
                ❌ Erro Completo
              </EnhancedButton>
              <EnhancedButton 
                variant="primary" 
                size="large"
                onClick={(e) => {
                  gameFeel.onPerfect(e.target);
                  handleParticleBurst(e);
                  setTimeout(() => handleScreenShake(), 200);
                }}
              >
                🏆 Perfeito!
              </EnhancedButton>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <p>
            Esta demonstração mostra todos os efeitos de game feel implementados no LudoMusic.
            <br />
            Cada interação combina feedback visual, sonoro e tátil para uma experiência mais imersiva.
          </p>
          <EnhancedButton 
            variant="secondary" 
            onClick={() => window.history.back()}
          >
            ← Voltar ao Jogo
          </EnhancedButton>
        </div>
      </div>
    </>
  );
}
