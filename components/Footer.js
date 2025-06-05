import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { t, isClient, language } = useLanguage();
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>{isClient ? t('footer_rights') : '© 2025 Ludomusic - Todos os direitos reservados'}</p>
        <p>{isClient ? t('footer_developed') : 'Desenvolvido com ❤️ para a comunidade gamer'}</p>
        <p>{isClient ? t('footer_background') : 'Background feito por'} <a href='https://x.com/Azzy_JP'>@Azzy_JP</a></p>
        <p>{isClient ? t('footer_logo') : 'Logo feita por'} <a href='https://x.com/IvanBaroni_'>@IvanBaroni_</a></p>
        <p>{isClient ? t('footer_inspired') : 'Inspirado por'} <a href='https://gamedle.wtf' target='_blank' rel='noopener noreferrer'>Gamedle</a></p>
        <p>
          {language === 'pt-BR' && (
            <>
              <a href="/termos-de-uso">{isClient ? t('footer_terms') : 'Termos de Uso'}</a> |
              <a href="/politica-de-privacidade">{isClient ? t('footer_privacy') : 'Política de Privacidade'}</a> |
              <a href="/remocao-de-conteudo">{isClient ? t('footer_removal') : 'Remoção de Conteúdo'}</a>
            </>
          )}
          {language === 'en-US' && (
            <>
              <a href="/terms-of-use">{isClient ? t('footer_terms') : 'Terms of Use'}</a> |
              <a href="/privacy-policy">{isClient ? t('footer_privacy') : 'Privacy Policy'}</a> |
              <a href="/content-removal">{isClient ? t('footer_removal') : 'Content Removal'}</a>
            </>
          )}
          {language === 'es' && (
            <>
              <a href="/terminos-de-uso">{isClient ? t('footer_terms') : 'Términos de Uso'}</a> |
              <a href="/politica-de-privacidad">{isClient ? t('footer_privacy') : 'Política de Privacidad'}</a> |
              <a href="/eliminacion-de-contenido">{isClient ? t('footer_removal') : 'Eliminación de Contenido'}</a>
            </>
          )}
        </p>
      </div>
    </footer>
  );
};

export default Footer;