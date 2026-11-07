/*
 * Added:
 * This class validate CPF/CNPJ
 */
Ext.define('Ext.data.validator.CpfCnpj', {
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.cpfcnpj',

    type: 'cpfcnpj',
    
    config: {
        message: 'CPF/CNPJ inválido'
    },

    validate: function(value) {
        value = SamosUtils.String.onlyNumbers(value);
        
        if (!value) return true;

        var value = value ? value : '',
            type = this.verifyType(value),
            value  = value.toString(),
            value  = value.replace(/[^0-9]/g, '');

        if (type === 'CPF') {
            return this.cpfValidate(value);

        } else if (type === 'CNPJ') {
            return this.cnpjValidate(value);

        } else {
            return this.getMessage();
        }
        
    },

    //Verifica se é CPF ou CNPJ
    verifyType: function(value) {
        var value = value.toString();
            value = value.replace(/[^0-9]/g, '');

        if (value.length === 11) {
            return 'CPF';
        } else if (value.length === 14) {
            return 'CNPJ';
        } else {
            return false;
        }
        
    },

    /*
     * @param  string cpf o CPF com ou sem pontos e traço
     * @return bool True para CPF correto - False para CPF incorreto
     */
    cpfValidate: function(value) {
        var value    = value.toString();
            value    = value.replace(/[^0-9]/g, '');
            chars    = value.substr(0, 9);
            newCpf   = this.calc(chars, 10);
            newCpf   = this.calc(newCpf, 11);
     
        if (newCpf === value) {
            return true;
        } else {
            return this.getMessage();
        }
    },

    /*
     * @param string cnpj
     * @return bool true para CNPJ correto
     */
    cnpjValidate: function(value) {
        var value      = value.toString();
            value      = value.replace(/[^0-9]/g, '');
            original   = value;
            firstChars = value.substr(0, 12);
            firstCalc  = this.calc(firstChars, 5);
            secondCalc = this.calc(firstCalc, 6);
            cnpj       = secondCalc;
     
        if (cnpj === original) {
            return true;
        } else {
            return this.getMessage();
        }
    },
               
    /*
     * @param string digitos Os digitos desejados
     * @param string posicoes A posição que vai iniciar a regressão
     * @param string soma_digitos A soma das multiplicações entre posições e dígitos
     * @return string Os dígitos enviados concatenados com o último dígito
     */
    calc: function(chars, positions) {
        var chars = chars.toString(),
            sumChars = 0;
     
        // Faz a soma dos dígitos com a posição
        // Ex. para 10 posições:
        //   0    2    5    4    6    2    8    8   4
        // x10   x9   x8   x7   x6   x5   x4   x3  x2
        //   0 + 18 + 40 + 28 + 36 + 10 + 32 + 24 + 8 = 196
        for ( var i = 0; i < chars.length; i++  ) {
            sumChars = sumChars + (chars[i] * positions);
            positions--;
     
            // Parte específica para CNPJ
            // Ex.: 5-4-3-2-9-8-7-6-5-4-3-2
            if (positions < 2) {
                // Retorno a posição para 9
                positions = 9;
            }
        }
     
        // Captura o resto da divisão entre soma_digitos dividido por 11
        // Ex.: 196 % 11 = 9
        sumChars = sumChars % 11;
     
        // Verifica se soma_digitos é menor que 2
        if (sumChars < 2) {
            sumChars = 0;
        } else {
            sumChars = 11 - sumChars;
        }

        var cpf = chars + sumChars;

        return cpf;
        
    },
     
    //Formata um CPF ou CNPJ
    formata_cpf_cnpj: function(value) {
        var formated = false;
            type = this.verifyType(value);
            value = value.toString();
            value = value.replace(/[^0-9]/g, '');
     
        if (type === 'CPF') {

            if (cpfValidate(value)) {
            
                // Formata o CPF ###.###.###-##
                formated  = value.substr(0, 3) + '.';
                formated += value.substr(3, 3) + '.';
                formated += value.substr(6, 3) + '-';
                formated += value.substr(9, 2) + '';
            }

        } else if (type === 'CNPJ') {

            if (cnpjValidate( value )) {
            
                // Formata o CNPJ ##.###.###/####-##
                formated  = value.substr(0, 2) + '.';
                formated += value.substr(2, 3) + '.';
                formated += value.substr(5, 3) + '/';
                formated += value.substr(8, 4) + '-';
                formated += value.substr(12,14) + '';
            }
        }

        return formated;
    }
});
