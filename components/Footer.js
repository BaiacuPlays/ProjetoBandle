import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons'; // Ícone de e-mail
import { faInstagram, faTwitter, faFacebook, faYoutube } from '@fortawesome/free-brands-svg-icons'; // Ícones de marcas
import { faShoppingBasket } from '@fortawesome/free-solid-svg-icons'; // Ícone de cesta de compras
import { faCube } from '@fortawesome/free-solid-svg-icons'; // Escolhi faCube como um placeholder para o ícone abstrato/logo

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© 2025 Ludomusic - Todos os direitos reservados</p>
        <p>Desenvolvido com ❤️ para a comunidade gamer</p>
        <p>Background feito por @Azzy_JP</p>
         <p>Este site utiliza trechos de áudio com fins de entretenimento. <br/> Todos os direitos sobre as músicas pertencem aos seus respectivos detentores.</p>
        <p><a href="/termos-de-uso">Termos de Uso</a> | <a href="/politica-de-privacidade">Política de Privacidade</a> | <a href="/remocao-de-conteudo">Remoção de Conteúdo</a></p>
        <div className="social-icons">
          {/* Ícone de Email */}
          <a href="mailto:andreibonatto8@gmail.com" className="social-icon">
            <FontAwesomeIcon icon={faEnvelope} />
          </a>
          {/* Ícone do Instagram */}
          <a href="https://instagram.com/bandle_game" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          {/* Ícone do Twitter */}
          <a href="https://twitter.com/bandle_game" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faTwitter} />
          </a>
          {/* Ícone de Loja/Cesta de Compras */}
          <a href="#" className="social-icon"> {/* Coloque o link para a sua loja aqui */}
            <FontAwesomeIcon icon={faShoppingBasket} />
          </a>
          {/* Ícone do Facebook */}
          <a href="https://facebook.com/bandle_game" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faFacebook} />
          </a>
          {/* Ícone do YouTube */}
          <a href="https://youtube.com/bandle_game" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;