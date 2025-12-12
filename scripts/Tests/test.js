import React from 'react';
import { createRoot } from 'react-dom/client';

const domNode = document.getElementById('root');
const root = createRoot(domNode);

function App({ name }) {
    return (
        <h1>Hello, {name}!</h1>
    )
}

root.render(<App name="홍길동" />);