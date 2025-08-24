import '../assets/main.css';
import './example';

const title = document.createElement('div');
title.className = 'title';
title.innerHTML = `Press for Run/Stop`;
document.body.appendChild(title);

const github = document.createElement('a');
github.className = 'github';
github.href = 'https://github.com/hikorniienko/teren';
document.body.appendChild(github);

const code = document.createElement('a');
code.className = 'code';
code.href = 'https://github.com/hikorniienko/teren/blob/main/examples/example_01/example.ts';
document.body.appendChild(code);