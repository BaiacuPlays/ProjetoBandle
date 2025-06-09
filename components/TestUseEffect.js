import { useEffect, useState } from 'react';

export default function TestUseEffect() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('useEffect não executado');

  console.log('🧪 TestUseEffect: Componente renderizado');

  useEffect(() => {
    console.log('🧪 TestUseEffect: useEffect executado!');
    setCount(1);
    setMessage('✅ useEffect FUNCIONOU!');

    // Também modificar o título da página para confirmar
    if (typeof window !== 'undefined') {
      document.title = 'useEffect Funcionou!';
    }
  }, []);

  return (
    <div style={{ padding: '10px', border: '2px solid red', margin: '10px' }}>
      <h2>🧪 Teste useEffect</h2>
      <p><strong>Count:</strong> {count}</p>
      <p><strong>Status:</strong> {message}</p>
      <p><strong>Título da página deve mudar se useEffect funcionar</strong></p>
    </div>
  );
}
