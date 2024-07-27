// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/MyPlayerControl.js', // Punto di ingresso dei file sorgenti
  output: {
    file: 'dist/MyPlayerControlBundle.js', // File di output
    format: 'cjs', // Formato del bundle, 'cjs' per CommonJS
  },
  plugins: [
    resolve(), // Permette di importare moduli da node_modules
    commonjs() // Converte CommonJS in ES6 per poter essere gestito da Rollup
  ]
};