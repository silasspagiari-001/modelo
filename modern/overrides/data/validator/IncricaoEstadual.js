/*
 * Added:
 * This class validate "Inscrição Estadual"
 * Rules: http://www.sintegra.gov.br/Cad_Estados/cad_TO.html
 */

Ext.define('Ext.data.validator.InscricaoEstadual', {
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.inscricaoestadual',

    type: 'inscricaoestadual',
    
    config: {
        message: 'Inscrição inválida',
        estadoText: 'Informe o estado',
        presenceText: 'Campo obrigatório',
        presence: true,
        module: undefined,
        estadoField: undefined
    },

    validate: function (value, model) {
        var module = this.getModule() ? this.getModule() : '',
            estadoField = this.getEstadoField() ? this.getEstadoField() : 'CIDADES_ESTADO',
            value = value ? value : '',
            value  = value.toString(),
            estado = model.get(estadoField),
            cnpj = this.verifyCnpj(model.get(module.toUpperCase() + '_CPFCNPJ')),
            rg = !cnpj;

        if (rg || value == 'ISENTO') {
            return true;

        } else if (value == '') {
            return this.getPresence() ? this.getPresenceText() : true;

        } else if (!estado) {
            return this.getEstadoText();
        
        } else if (this.check(value , estado)) {
            return true

        } else {
            return this.getMessage();
        }
    },

    verifyCnpj: function(value) {
        var value = value ? value.toString() : '';
            value = value.replace(/[^0-9]/g, '');

        return value.length == 14;
    },

    check: function(ie, estado) {
        ie = ie.replace(/\./g, '');
        ie = ie.replace(/\\/g, '');
        ie = ie.replace(/\-/g, '');
        ie = ie.replace(/\//g, '');

        return this[estado](ie);
    },

    charToInt: function(ch) {
        return (ch.charCodeAt(0)) - ('0'.charCodeAt(0));
    },

    intToChar: function (intt) {
        return String.fromCharCode(intt + ('0'.charCodeAt(0)));
    },

    AC: function (ie) {
        if (ie.length != 13) return false;
        var b = 4, soma = 0, dig;

        for (var i = 0; i <= 10; i++) {
            soma += this.charToInt(ie.charAt(i)) * b;
            --b;
            if (b == 1) b = 9;
        }
        
        dig = 11 - (soma % 11);
        if (dig >= 10) dig = 0;
        if (!(this.intToChar(dig) == ie.charAt(11))) return false;

        b = 5;
        soma = 0;
        for (var i = 0; i <= 11; i++) {
            soma += this.charToInt(ie.charAt(i)) * b;
            --b;
            if (b == 1) b = 9;
        }
        dig = 11 - (soma % 11);
        if (dig >= 10) dig = 0;
        if (this.intToChar(dig) == ie.charAt(12)) {
            return true
        } else { 
            return false
        }
    },

    AL: function(ie) {
        if (ie.length != 9) return false;
        var b = 9, soma = 0, dig;
        
        for (var i = 0; i <= 7; i++) {
            soma += this.charToInt(ie.charAt(i)) * b;
            --b;
        }
        soma *= 10;
        dig = soma - Math.floor(soma / 11) * 11;
        if (dig == 10) dig = 0;
        return (this.intToChar(dig) == ie.charAt(8));
    },

    AM: function (ie) {
        if (ie.length != 9) return false;
        
        var b = 9, 
            soma = 0, 
            dig;

        for (var i = 0; i < 8; i++) {
            soma += this.charToInt(ie.charAt(i)) * b;
            b--;
        }
        if (soma < 11) { 
            dig = 11 - soma; 
        } else { 
            i = soma % 11;
            dig = (i <= 1) ? 0 : 11 - i;
        }
        return (this.intToChar(dig) == ie.charAt(8));
    },

    AP: function(ie) {
        if (ie.length != 9) return false;
        
        var soma = 0, 
            d = 0, 
            i = ie.substring(1, 8),
            b = 9,
            dig;
        
        if ((i >= 3000001) && (i <= 3017000)) {
            soma = 5;
            d = 0;
        } else if ((i >= 3017001) && (i <= 3019022)) {
            soma = 9;
            d = 1;
        }
        
        for (var i = 0; i <= 7; i++) {
            soma += this.charToInt(ie.charAt(i)) * b;
            b--;
        }
        dig = 11 - (soma % 11);
        if (dig == 10) {
            dig = 0;
        } else if (dig == 11) {
            dig = d;
        }
        
        return (this.intToChar(dig) == ie.charAt(8));
    },

    BA: function(ie) {
        if (ie.length != 8) return false;

        var die = ie.substring(0, 8),
            nro = new Array(8),
            dig = -1,
            b = 7,
            soma = 0;
        
        for (var i = 0; i <= 7; i++) {
            nro[i] = this.charToInt(die.charAt(i));
        }
        var NumMod = (String(nro[0]).match(/[0123458]/)) ? 10 : 11;
        
        for (i = 0; i <= 5; i++) {
            soma += nro[i] * b;
            b--;
        }

        i = soma % NumMod;
        if (NumMod == 10) {
            dig = (i == 0) ? 0 : NumMod - i; 

        } else {
            dig = (i <= 1) ? 0 : NumMod - i;
        }

        if (!(dig == nro[7])) return false;
        b = 8;
        soma = 0;
        for (i = 0; i <= 5; i++) {
            soma += nro[i] * b;
            b--;
        }
        soma += nro[7] * 2;
        i = soma % NumMod;
        if (NumMod == 10) {
            dig = (i == 0) ? 0 : NumMod - i;
        } else {
            dig = (i <= 1) ? 0 : NumMod - i;
        }
        return (dig == nro[6]);
    },

    CE: function(ie) {
        if (ie.length > 9) return false;
        var die = ie,
            nro = Array(9);

        if (ie.length < 9) {
            while (die.length <= 8) {
                die = '0' + die;
            }
        }
        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(die[i]);
        }
        b = 9;
        soma = 0;
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--; 
        }
        dig = 11 - (soma % 11);
        if (dig >= 10) dig = 0;
        return (dig == nro[8]);
    },

    DF: function (ie) {
        if (ie.length != 13) return false;

        var nro = new Array(13),
            b = 4,
            soma = 0,
            dig;

        for (var i = 0; i <= 12; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 10; i++) {
            soma += nro[i] * b;
            b--;
            if (b == 1) b = 9;
        }
        dig = 11 - (soma % 11);
        if (dig >= 10) dig = 0;
        if (!(dig == nro[11])) return false;  
        b = 5;
        soma = 0;
        for (i = 0; i <= 11; i++) {
            soma += nro[i] * b;
            b--;
            if (b == 1) b = 9;
        }
        dig = 11 - (soma % 11);
        if (dig >= 10) dig = 0;
        return (dig == nro[12]);
    },

    ES: function (ie) {
        if (ie.length != 9) return false;

        var nro = new Array(9),
            b = 9,
            soma = 0;

        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i)); 
        }
        
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--;
        }
        i = soma % 11;
        dig = (i < 2) ? 0 : 11 - i;

        return (dig == nro[8]);
    },

    GO: function (ie) {
        if (ie.length != 9) return false;
        
        var s = ie.substring(0, 2),
            nro = new Array(9),
            n = Math.floor(ie / 10),
            b = 9,
            soma = 0,
            dig;

        if ((s == '10') || (s == '11') || (s == '15')) {
            for (var i = 0; i <= 8; i++) {
                nro[i] = this.charToInt(ie.charAt(i));
            }
            
            if (n = 11094402) {
                if ((nro[8] == 0) || (nro[8] == 1)) return true;
            }
            
            for (i = 0; i <= 7; i++) {
                soma += nro[i] * b;
                b--;
            }
            i = soma % 11;
            if (i == 0) {
                dig = 0;
            } else {
                if (i == 1) {
                    dig = ((n >= 10103105) && (n <= 10119997)) ? 1 : 0
                } else {
                    dig = 11 - i;
                }
            }
            return (dig == nro[8]);

        } else {
            return false
        }
    },

    MA: function (ie) {
        if (ie.length != 9) return false;

        var nro = new Array(9),
            b = 9,
            soma = 0,
            dig;

        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--;
        }
        i = soma % 11;
        dig = (i <= 1) ? 0 : 11 - i;

        return (dig == nro[8]);
    },

    MG: function(ie) {
        if (ie.substring(0,2) == 'PR') return true
        if (ie.substring(0,5) == 'ISENT') return true;
        if (ie.length != 13) return false;

        var dig1 = ie.substring(11, 12),
            dig2 = ie.substring(12, 13),
            inscC = ie.substring(0, 3) + '0' + ie.substring(3, 11),
            insc = inscC.split(''),
            npos = 11,
            i = 1,
            ptotal = 0,
            psoma = 0,
            nresto, is;

        while (npos >= 0) {
            i++;
            psoma = this.charToInt(insc[npos]) * i;  
            if (psoma >= 10) psoma -= 9;
            ptotal += psoma;
            if (i == 2) i = 0;
            npos--;
        }
        nresto = ptotal % 10;
        if (nresto == 0) nresto = 10;
        nresto = 10 - nresto;
        if (nresto != this.charToInt(dig1)) return false;
        npos = 11;
        i = 1;
        ptotal = 0;
        is = ie.split('');
        while (npos >= 0) {
            i++;
            if (i == 12) i = 2;
            ptotal += this.charToInt(is[npos]) * i;
            npos--;
        }
        nresto = ptotal % 11;
        if ((nresto == 0) || (nresto == 1)) nresto = 11;
        nresto = 11 - nresto;  
        return (nresto == this.charToInt(dig2));
    },

    MT: function(ie) {
        if (ie.length != 11) return false;
        
        var nro = new Array(11),
            b = 3,
            soma = 0;

        for (var i = 0; i <= 10; i++) {
            nro[i] = this.charToInt(ie[i]);
        }
        
        for (i = 0; i < 10; i++) {
            soma += nro[i] * b;
            b--;
            if (b == 1) b = 9;
        }
        i = soma % 11;
        dig = (i <= 1) ? 0 : 11 - i;
        return (dig == nro[10]);
    },

    MS: function (ie) {
        if (ie.length != 9) return false;
        if (ie.substring(0,2) != '28')  return false;

        var nro = new Array(9),
            b = 9,
            soma = 0,
            dig;

        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--;
        }
        i = soma % 11;
        dig = (i <= 1) ? 0 : 11 - i;
        return (dig == nro[8]);
    },

    PA: function (ie) {
        if (ie.length != 9) return false;
        if (ie.substring(0, 2) != '15') return false;
        
        var nro = new Array(9),
            b = 9,
            soma = 0, 
            dig;

        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--;
        }
        i = soma % 11;
        dig = (i <= 1) ? 0 : 11 - i;
        return (dig == nro[8]);
    },

    PB: function (ie) {
        if (ie.length != 9) return false;

        var nro = new Array(9),
            b = 9,
            soma = 0;

        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--;  
        }
        i = soma % 11;
        dig = (i <= 1) ? 0 : 11 - i;
        return (dig == nro[8]);
    },

    PE: function(ie) {
        if (ie.length != 9) return false;
        
        var nro = new Array(9),
            b = 8,
            soma = 0,
            dig;

        for (var i = 0; i < 9; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i < 7; i++) {
            soma += nro[i] * b;
            b--;
        }

        dig = ((soma % 11) < 2) ? 0 : 11 - (soma % 11);
        if (dig != nro[7]) return false

        b = 9;
        soma = 0;

        for (i = 0; i < 8; i++) {
            soma += nro[i] * b;
            b--;
        }

        dig = ((soma % 11) < 2) ? 0 : 11 - (soma % 11);
        return (dig == nro[8])
    },

    PI: function (ie) {
        if (ie.length != 9) return false;
        var nro = new Array(9);
        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        b = 9;
        soma = 0;
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--;
        }
        i = soma % 11;
        dig = (i <= 1) ? 0 : 11 - i;
        return (dig == nro[8]);
    },

    PR: function (ie) {
        if (ie.length != 10) return false;

        var nro = new Array(10),
            b = 3,
            soma = 0,
            dig;

        for (var i = 0; i <= 9; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--;
            if (b == 1)  b = 7;
        }

        i = soma % 11;

        dig = (i <= 1) ? 0 : 11 - i;

        if (!(dig == nro[8])) return false;
        
        b = 4;
        soma = 0;
        for (i = 0; i <= 8; i++) {
            soma += nro[i] * b;
            b--;
            if (b == 1)  b = 7;
        }

        i = soma % 11;
        dig = (i <= 1) ? 0 : 11 - i;
        return (dig == nro[9]);
    },

    RJ: function (ie) {
        if (ie.length != 8) return false;

        var nro = new Array(8),
            b = 2,
            soma = 0,
            dig;

        for (var i = 0; i <= 7; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 6; i++) {
            soma += nro[i] * b;
            b--;
            if (b == 1) b = 7;
        }
        i = soma % 11;
        dig = (i <= 1) ? 0 : 11 - i;
        return (dig == nro[7]);
    },

    RN: function  (ie) {
        if (ie.length != 9) return false;

        var nro = new Array(9),
            b = 9,
            soma = 0,
            dig;

        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--;
        }
        soma *= 10;
        dig = soma % 11;
        dig = (dig == 10) ? 0 : dig;
        return (dig == nro[8]);
    },

    RO: function (ie) {
        if (ie.length != 14) return false;

        var nro = new Array(14),
            b = 6,
            soma = 0,
            dig;

        for (var i=0; i <= 4; i++) {
            nro[i] = this.charToInt(ie.charAt(i));        
            soma = soma + ( nro[i] * b );
            b--;
        }

        b = 9;
        for (var i=5; i <= 13; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
            if ( i != 13 ) {
                soma = soma + ( nro[i] * b );
                b--;
            }
        }
        dig = 11 - ( soma % 11);                            
        dig = (dig >= 10) ? dig - 10 : dig;
        //return(dig == nro[13]); original
        //força checar a funcao antiga se nao passar na atual
        if (dig != nro[13]) {
            return this.ROAntiga(ie);
        } else {
            return true
        }
    },

    //RO Antiga
    ROAntiga: function (ie) {
        if (ie.length != 9) return false

        var nro = new Array(9),
            b = 6,
            soma = 0,
            dig;

        for ( var i = 3; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i));

            if (i != 8) {
                soma = soma + ( nro[i] * b );
                b--;
            }
        }

        dig = 11 - (soma % 11);
        dig = (dig >= 10) ? dig - 10 : dig;

        return (dig == nro[8]);
    },

    RR: function (ie) {
        if (ie.length != 9) return false;
        if (ie.substring(0,2) != '24') return false;
        
        var nro = new Array(9),
            soma = 0,
            n = 0,
            dig;

        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * ++n;
        }
        dig = soma % 9;
        return (dig == nro[8]);
    },

    RS: function (ie) {
        if (ie.length != 10) return false;

        var i = ie.substring(0, 3),
            b = 2,
            soma = 0;

        if ((i >= 1) && (i <= 467)) {
            var nro = new Array(10);
            for (var i = 0; i <= 9; i++) {
                nro[i] = this.charToInt(ie.charAt(i));
            }
            
            for (i = 0; i <= 8; i++) {
                soma += nro[i] * b;
                b--;
                if (b == 1) b = 9;
            }
            dig = 11 - (soma % 11);
            if (dig >= 10) dig = 0;
            return (dig == nro[9]);
        } else {
            return false
        }
    },

    SC: function(ie) {
        if (ie.length != 9) return false;
        
        var nro = new Array(9),
            b = 9,
            soma = 0;

        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--;
        }
        i = soma % 11;
        dig = (i <= 1) ? 0 : 11 - i;
        return (dig == nro[8]);
    },

    SE: function (ie) {
        if (ie.length != 9) return false;

        var nro = new Array(9),
            b = 9,
            soma = 0;

        for (var i = 0; i <= 8; i++) {
            nro[i] = this.charToInt(ie.charAt(i));
        }
        
        for (i = 0; i <= 7; i++) {
            soma += nro[i] * b;
            b--;
        }
        dig = 11 - (soma % 11);
        if (dig >= 10) dig = 0;
        return (dig == nro[8]);
    },

    SP: function(ie) {
        var nro = new Array(12),
            soma, dig;

        if (((ie.substring(0,1)).toUpperCase()) == 'P') {
            s = ie.substring(1, 9);
            
            for (var i = 0; i <= 7; i++) {
                nro[i] = this.charToInt(s[i]);
            }
            soma = (nro[0] * 1) + (nro[1] * 3) + (nro[2] * 4) + (nro[3] * 5);
            soma += (nro[4] * 6) + (nro[5] * 7) + (nro[6] * 8) + (nro[7] * 10);
            dig = soma % 11;
            if (dig >= 10) dig = 0;
            return (dig == nro[8]);
        } else {
            if (ie.length < 12) return false;
            for (var i = 0; i <= 11; i++) {
                nro[i] = this.charToInt(ie.charAt(i));
            }
            soma = (nro[0] * 1) + (nro[1] * 3) + (nro[2] * 4) + (nro[3] * 5);
            soma += (nro[4] * 6) + (nro[5] * 7) + (nro[6] * 8) + (nro[7] * 10);
            dig = soma % 11;
            if (dig >= 10) dig = 0;
            if (!(dig == nro[8])) return false;
            soma = (nro[0] * 3) + (nro[1] * 2) + (nro[2] * 10) + (nro[3] * 9);
            soma += (nro[4] * 8) + (nro[5] * 7) + (nro[6] * 6)  + (nro[7] * 5);
            soma += (nro[8] * 4) + (nro[9] * 3) + (nro[10] * 2);
            dig = soma % 11;
            if (dig >= 10)  dig = 0;
            return (dig == nro[11]);
        }
    },

    TO: function (ie) {
        if (ie.length != 11) return false;

        var nro = new Array(11),
            b = 9,
            soma = 0;

        for (var i = 0; i < 11; i++ ) {
            nro[i] = this.charToInt(ie.charAt(i));

            if (i != 2 && i != 3 && i != 10) {
                soma += nro[i] * b;
                b--;
            }
        }
        i = soma % 11;

        dig = (i < 2) ? 0 : 11 - i;

        return dig == nro[10];
    }
});
