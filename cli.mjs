import {readFile} from 'node:fs/promises';
import {evaluate,sweep} from './contract.mjs';
const input=process.argv[2]?JSON.parse(await readFile(process.argv[2],'utf8')):null;
console.log(JSON.stringify(input?evaluate(input.parameters,input.options):sweep(),null,2));
