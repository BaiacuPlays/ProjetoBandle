"use strict";(()=>{var e={};e.id=660,e.ids=[660],e.modules={6105:(e,a,t)=>{t.r(a),t.d(a,{default:()=>r});var o=t(997),s=t(6859),i=t.n(s);class n extends i(){static async getInitialProps(e){return{...await i().getInitialProps(e)}}render(){return(0,o.jsxs)(s.Html,{lang:"pt-BR",children:[o.jsx(s.Head,{children:o.jsx("script",{dangerouslySetInnerHTML:{__html:`
              try {
                // Verificar primeiro o localStorage
                const savedSettings = localStorage.getItem('bandle_settings');
                let language = null;

                if (savedSettings) {
                  const parsedSettings = JSON.parse(savedSettings);
                  if (parsedSettings.language) {
                    language = parsedSettings.language;
                  }
                }

                // Verificar cookie como fallback
                if (!language) {
                  const cookies = document.cookie.split(';');
                  for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.startsWith('bandle_language=')) {
                      language = cookie.substring('bandle_language='.length);
                      break;
                    }
                  }
                }

                // Aplicar o idioma
                if (language) {
                  document.documentElement.lang = language;
                  console.log('Idioma aplicado pelo _document.js:', language);

                  // Se o idioma veio do cookie, mas n\xe3o est\xe1 no localStorage, salv\xe1-lo
                  if (!savedSettings || !JSON.parse(savedSettings).language) {
                    const defaultSettings = {
                      daltonicMode: false,
                      sound: true,
                      animations: true,
                      language: language
                    };
                    localStorage.setItem('bandle_settings', JSON.stringify(defaultSettings));
                    console.log('Configura\xe7\xf5es salvas do cookie para localStorage:', defaultSettings);
                  } else if (savedSettings) {
                    // Se j\xe1 existe configura\xe7\xf5es no localStorage, atualizar o idioma
                    try {
                      const settings = JSON.parse(savedSettings);
                      if (settings.language !== language) {
                        settings.language = language;
                        localStorage.setItem('bandle_settings', JSON.stringify(settings));
                        console.log('Idioma atualizado no localStorage:', settings);
                      }
                    } catch (e) {
                      console.error('Erro ao atualizar idioma no localStorage:', e);
                    }
                  }
                }
              } catch (e) {
                console.error('Erro ao aplicar idioma em _document.js:', e);
              }
            `}})}),(0,o.jsxs)("body",{children:[o.jsx(s.Main,{}),o.jsx(s.NextScript,{})]})]})}}let r=n},2785:e=>{e.exports=require("next/dist/compiled/next-server/pages.runtime.prod.js")},6689:e=>{e.exports=require("react")},997:e=>{e.exports=require("react/jsx-runtime")},1017:e=>{e.exports=require("path")}};var a=require("../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),o=a.X(0,[859],()=>t(6105));module.exports=o})();