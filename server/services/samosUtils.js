'use strict'; 

const fs      = require('fs');
const path    = require('path');
const moment  = require('moment-timezone');
const samosFB = require('./samosFB');

module.exports = {
    log: function (value, replaceContent, fileName = 'server.log') {
        if(!value) { return; }
    
        const date = moment().format('DD/MM/YYYY');
        const time = moment().format('HH:mm:ss');
    
        if(value.toString() == '[object Object]') {
            value = JSON.stringify(value);
        }
    
        if(fs.existsSync(fileName) && replaceContent !== true) {
            fs.writeFileSync(fileName, fs.readFileSync(fileName) + `\r\n${date} ${time} - ${value}`);
        } else {
            fs.writeFileSync(fileName, value);
        }
    },

    sleep: async function(ms) {
        return await new Promise(resolve => setTimeout(() => resolve(), ms));
    },

    string: {
        onlyNumbers: function (value) {
            value = value ? value.toString() : '';

            return value.replace(/[^0-9]/g, '');
        },
        
        quoted: function (string) {
            return `'${string}'`;
        },
    
        quotedArray: function (array) {
            for(let i in array) {
                array[i] = this.quoted(array[i]);
            }
    
            return array;
        },
    
        completeChars: function (string, chars, char = '0', direction = 'left') {
            var string = (string && string.toString) ? string.toString() : '',
                nCharsToComplete = chars - string.length;
    
            for (var i = 0; i < nCharsToComplete; i++) {
                if(direction == 'left'){
                    string = char + string;
                } else if(direction == 'rigth'){
                    string = string + char;
                } 
            }
    
            return string;
        },

        clearSpecial: function (s = '', keepSpace) {
            const specialChars = [
                    {val:"a",let:"áàãâä"},
                    {val:"e",let:"éèêë"},
                    {val:"i",let:"íìîï"},
                    {val:"o",let:"óòõôö"},
                    {val:"u",let:"úùûü"},
                    {val:"c",let:"ç"},
                    {val:"A",let:"ÁÀÃÂÄ"},
                    {val:"E",let:"ÉÈÊË"},
                    {val:"I",let:"ÍÌÎÏ"},
                    {val:"O",let:"ÓÒÕÔÖ"},
                    {val:"U",let:"ÚÙÛÜ"},
                    {val:"C",let:"Ç"},
                    {val:"S",let:"$"},
                    {val:"",let:"?!%()-/"},
                    {val:"",let: keepSpace ? "" : " "}
                ];
            let returnString = s;
    
            for (var i = 0; i < specialChars.length; i++) {
                const regex = new RegExp("[" + specialChars[i].let + "]", "g");
                returnString = returnString.replace(regex, specialChars[i].val);
            }
    
            return returnString;
        },

        removerEspeciais: function(str) {
            // Remove caracteres específicos usando expressões regulares
            const caracteresParaRemover = /[f./\-(){},"«:,+ª\n\r\u000C\u0027]/g;
            let resultado = str.replace(caracteresParaRemover, '');
          
            // Remove espaços extras no começo e no fim da string
            resultado = resultado.trim();
          
            return resultado;
        },

        removerAcentos: function(str) {
            const acentuadosChars = [
              'á','à','ã','â','ä','é','è','ê','ë','í','ì','ï','î',
              'ó','ò','õ','ô','ö','ú','ù','ü','û','ç','ñ','ý','ÿ',
              'Æ','À','Á','Ô','Ã','Õ','Â','Ê','É','Í','Ó','Ú','Ç','Ü','¢','‡','&'
            ];
          
            const normalChars = [
              'a','a','a','a','a','e','e','e','e','i','i','i','i',
              'o','o','o','o','o','u','u','u','u','c','n','y','y',
              'A','A','A','O','A','O','A','E','E','O','O','U','C','U','c','‡','&'
            ];
          
            let result = str;
            for (let i = 0; i < acentuadosChars.length; i++) {
              const regex = new RegExp(acentuadosChars[i], 'g');
              result = result.replace(regex, normalChars[i]);
            }
            return result;
        },

        apenasASCII: function(s) {
            let result = '';
            for (let i = 0; i < s.length; i++) {
              if (s.charCodeAt(i) <= 127) {
                result += s[i];
              }
            }
            return result;
        },        
    
        escapeSingleQuotes: function (data) {
            return Object.keys(data)
                .reduce((dataEscaped, field) => {
                    if(typeof data[field] == 'string') {
                        data[field] = data[field].replace(/'/g, "''");
                    }
                    dataEscaped[field] = data[field];
                    return dataEscaped;
                }, {});
        },
        
        maskCnp: function (v) {
            if (v === null){
                v = undefined;
            } else if (typeof v == 'string' && v != '') {
                if(v.trim().length == 11) {
                    //if CPF
                    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g,"\$1.\$2.\$3\-\$4")
                } else {
                    //if CNPJ
                    v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g,"\$1.\$2.\$3\/\$4\-\$5")
                }
            }
            
            return v;
        },
    
        maskCep: function (v) {
            if (v === null){
                v = undefined;
            } else if (typeof v == 'string' && v != '') {
                v = v.replace(/(\d{5})(\d{3})/g,"\$1\-\$2")
            }
            
            return v;
        },
    
        maskFone: function (v) {
            if (v === null){
                v = undefined;
            } else if (typeof v == 'string' && v != '') {
                v=v.replace(/\D/g,"");                  //Remove tudo o que não é dígito
                v=v.replace(/^(\d{2})(\d)/g,"($1) $2"); //Coloca parênteses em volta dos dois primeiros dígitos
                v=v.replace(/(\d)(\d{4})$/,"$1-$2");    //Coloca hífen entre o quarto e o quinto dígitos       
            }
            
            return v;
        },
    
        maskMoney:function (v) {
    
            if(v == 0){
                return '';
            }
    
            v = v * 100;
            v = v.toString();
    
            v=v.replace(/\D/g,"");                       //Remove tudo o que não é dígito
            v=v.replace(/(\d{2})$/,",$1");               //Coloca a virgula
            v=v.replace(/(\d+)(\d{3},\d{2})$/g,"$1.$2"); //Coloca o primeiro ponto
            
            var qtdLoop = (v.length-3)/3;
            
            var count = 0;
            
            while (qtdLoop > count) {
            
                count++;       
                v=v.replace(/(\d+)(\d{3}.*)/,"$1.$2"); //Coloca o resto dos pontos
            
            }
                   
            return v;
        },
    
        firstUpper: function(str) { // Formata a string com o padrão para nomes - 1a letra maiúscula
            str = str.toLowerCase();
    
            return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
                return letter.toUpperCase();
            });
        },
    
        maskChaveNfe: function (v) {
            if (v === null){
                v = undefined;
            } else if (typeof v == 'string' && v != '') {
                    v = v.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})(\d{2})(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})(\d{1})/g,"$1-$2\/$3-$4.$5.$6\/$7-$8-$9-$10-$11.$12.$13-$14.$15.$16-$17")
            }
            
            return v;
        },

        maskChaveCfe: function (v) {
            if (v === null){
                v = undefined;
            } else if (typeof v == 'string' && v != '') {
                v = v.replace(/(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})/g,"$1 $2 $3 $4 $5 $6 $7 $8 $9 $10 $11")
            }
            
            return v;
        },
    
        maskProtocoloNfe: function (v) {
            if (v === null){
                v = undefined;
            } else if (typeof v == 'string' && v != '') {
                v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})/g,"$1.$2.$3.$4.$5")
            }
            
            return v;
        },
    
        maskLinhaBoleto: function (v) {
            if (v === null){
                v = undefined;
            } else if (typeof v == 'string' && v != '') {
                v = v.replace(/(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})(\d{14})/g,"$1.$2 $3.$4 $5.$6 $7 $8")
            }
            
            return v;
        },

        isEmail: function(emails) {
            emails = emails || '';
            if(typeof emails == 'string') {
                if(emails.match(/;/)) {
                    emails = emails.split(';');
                } else if(emails.match(/,/)) {
                    emails = emails.split(',');
                } else {
                    emails = [emails];
                }
            }
    
            const regexp = new RegExp(/^(")?(?:[^\."])(?:(?:[\.])?(?:[\w\-!#$%&'*+\/=?\^_`{|}~]))*\1@(\w[\-\w]*\.){1,5}([A-Za-z]){2,6}$/);
            
            return emails.every(email => regexp.test(email));
        },

        gerarGuid: function(){
            let date = new Date().getTime();
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (date + Math.random() * 16) % 16 | 0;
                date = Math.floor(date / 16);
                return (c == 'x' ? r :(r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        }
            
    },

    number: {
        cents: function (value) {
            return this.changeBase(value, 2);
        },

        grams: function (value) {
            return this.changeBase(value, 3);
        },

        coefs: function (value) {
            return this.changeBase(value, 4);
        },

        changeBase: function (value, precision = 0) {
            value = value || 0;
            value = typeof value == 'string' ? (value.match(/,/) ? value.replace('.', '').replace(',', '.') : value) : value;

            return parseInt((value * (Math.pow(10, precision))).toFixed(precision));
        },
        
        float2moeda: function (num, formatarZero) {
            if(num === 0 && !formatarZero) { return ''; }
            let x = 0;
        
            if(num < 0) {
                num = Math.abs(num);
                x = 1;
            }

            if(isNaN(num)) num = "0";
            let cents = Math.floor((num*100+0.5)%100);
            num = Math.floor((num*100+0.5)/100).toString();
        
            if(cents < 10) cents = "0" + cents;

            for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++) {
                num = num.substring(0,num.length-(4*i+3))+'.'
                        +num.substring(num.length-(4*i+3));
            }

            let ret = num + ',' + cents;
            if (x == 1) ret = ' - ' + ret;
            return ret;
        },

        strZero: function(num, len) {

            var numberAsString = String(num);
            var counter = numberAsString.length;
                
            while(counter < len) {              
                numberAsString = "0" + numberAsString;
                counter++;              
            }
            
            return numberAsString;
        },

        inteiroComSeparador: function(valor) {

            const formatado = valor.toLocaleString('pt-BR', {
                maximumFractionDigits: 0
              });

              return formatado;
        },

    // Funções para valores monetários por extenso     
        
        ValorPorExtenso: function(valor) {
        
            if (!valor) return 'ZERO';
            
            var singular = ['CENTAVO',  'REAL',  'MIL', 'MILHÃO',  'BILHÃO',  'TRILHÃO',  'QUATRILHÃO'];
            var plural   = ['CENTAVOS', 'REAIS', 'MIL', 'MILHÕES', 'BILHÕES', 'TRILHÕES', 'QUATRILHÕES'];
            
            var c   = ['', 'CEM', 'DUZENTOS', 'TREZENTOS', 'QUATROCENTOS', 'QUINHENTOS', 'SEISCENTOS', 'SETECENTOS', 'OITOCENTOS', 'NOVECENTOS'];
            var d   = ['', 'DEZ',   'VINTE',    'TRINTA',    'QUARENTA',     'CINQUENTA',  'SESSENTA',   'SETENTA',    'OITENTA',    'NOVENTA'];
            var d10 = ['DEZ', 'ONZE', 'DOZE', 'TREZE', 'QUATORZE', 'QUINZE', 'DEZESSEIS',  'DEZESSETE',  'DEZOITO',    'DEZENOVE'];
            var u   = ['', 'UM', 'DOIS', 'TRÊS', 'QUATRO', 'CINCO', 'SEIS', 'SETE', 'OITO', 'NOVE'];
            
            var z = 0;
            
            valor = valor.toString();
            valor = number_format(valor, 2, '.', '.');
            
            var inteiro = valor.split(/\./);
            
            for (var i = 0; i < inteiro.length; i++) {
                inteiro[i] = inteiro[i].toString();
                for (var ii = inteiro[i].length; ii < 3; ii++) {
                    inteiro[i] = '0' + inteiro[i];
                }
            }
            
            var fim = inteiro.length - (inteiro[inteiro.length-1] > 0 ? 1 : 2 );
            
            var rc, rd, ru;
            var r, t;
            var rt = '';
            var valor_split;
            for (var i = 0; i < inteiro.length; i++) {
            
            valor = inteiro[i];
            valor_split = valor.match(/./g);
            
            rc = ((valor > 100) && (valor < 200)) ? 'CENTO' : c[valor_split[0]];
            rd = (valor_split[1] < 2) ? '' : d[valor_split[1]];
            ru = (valor > 0) ? ((valor_split[1] == 1) ? d10[valor_split[2]] : u[valor_split[2]]) : '';
            
            r = rc + ((rc && (rd || ru)) ? ' E ' : '') + rd + ((rd && ru) ? ' E ' : '') + ru;
            t = inteiro.length - 1 - i;
            
            r = r + (r ? ' ' + (valor > 1 ? plural[t] : singular[t]) : '');
            if (valor == '000') z++;
            else if (z > 0) z--;
            
            if ((t==1) && (z>0) && (inteiro[0] > 0)) {
                r = r + ((z>1) ? " DE " : "") + plural[t];
            }
            if (r) {
                rt = rt + (((i > 0) && (i <= fim) && (inteiro[0] > 0) && (z < 1)) ? ( (i < fim) ? ", " : " E ") : " ") + r;
            }
            
            }
            
            return (rt ? rt : "ZERO");
        }
    },
    
    dblog: async function (params) {
        const metodos = {
            'GET'   : 'Busca',
            'POST'  : 'Inclusão',
            'PUT'   : 'Alteração',
            'DELETE': 'Exclusão'
        };

        let descricao = (params.log + (params.senhaNivel == 'true' ? ' (AUTORIZADO)' : ''));

        Object.keys(metodos).forEach(metodo => {
            descricao = descricao.replace(metodo, metodos[metodo]).slice(0, 100);
        });

        const log = {
            'LOGS_ID_PESSOAS' : params.userId || 0,
            'LOGS_ID_EMPRESAS': params.empresaLogada || 0,
            'LOGS_NOME'       : descricao,
            'LOGS_DATA'       : moment.tz(params.timezone).format('YYYY-MM-DD'),
            'LOGS_HORA'       : moment.tz(params.timezone).format('HH:mm:ss'),
            'LOGS_IP'         : params.ip
        };

        if(params.logstatus) {
            log['LOGS_STATUS'] = params.logstatus;
        }

        return await samosFB.insert('LOGS', log, params);
    },

    client: {
        getImagePath: function(caminho = '', params) {
            const client = params.client || '';

            const caminhoSplit = caminho.split('/').length == 1 ? 
                                 caminho.split('/')[0].split('\\') :
                                 caminho.split('/');
    
            const imagePath = path.join(process.cwd(), '..', client, 'imagens', ...caminhoSplit);
    
            if(fs.existsSync(imagePath)) {
                return imagePath;
            } else {
                throw new Error('Imagem não encontrada');
            }
        }
    }
};

const number_format = function(a, b, c, d) {
    a = Math.round(a * Math.pow(10, b)) / Math.pow(10, b);

    let e = a + '';
    let f = e.split('.');
    let i, j;

    if (!f[0]) {
        f[0] = '0';
    };

    if (!f[1]) {
        f[1] = '';
    };

    if (f[1].length < b) {
        let g = f[1];
        for (i=f[1].length + 1; i <= b; i++) {
            g += '0';
        }
        f[1] = g;
    };

    if(d != '' && f[0].length > 3) {
        let h = f[0];
        f[0] = '';
        for(j = 3; j < h.length; j+=3) {
            i = h.slice(h.length - j, h.length - j + 3);
            f[0] = d + i + f[0] + '';
        }
        j = h.substr(0, (h.length % 3 == 0) ? 3 : (h.length % 3));
        f[0] = j + f[0];
    }

    c = (b <= 0) ? '' : c;

    return f[0] + c + f[1];
}
