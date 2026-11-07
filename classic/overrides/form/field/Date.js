Ext.define('Overrides.form.field.Date', {
    override:'Ext.form.field.Date',

    format : "d/m/Y",
    msgTarget: 'qtip',

    submitFormat: 'Y-m-d',

    altFormats : "dmY|dmy|d-m-Y|d-m-y|d/m/Y|m/d/Y|n/j/Y|n/j/y|m/j/y|n/d/y|m/j/Y|n/d/Y|m-d-y|m-d-Y|m/d|m-d|md|mdy|mdY|d|Y-m-d|n-j|n/j",
    disabledDaysText : "Desabilitado",
    ariaDisabledDaysText: "Este dia da semana está desabilitado",
    disabledDatesText : "Desabilitado",
    ariaDisabledDatesText: "Esta data não pode ser selecionada",
    minText : "A data tem que ser igual ou posterior a {0}",
    ariaMinText: "A data tem que ser igual ou posterior a {0}",
    maxText : "A data tem que ser igual ou anterior a {0}",
    ariaMaxText: "A data tem que ser igual ou anterior a {0}",
    invalidText : "{0} não é uma data válida - Fomato: {1}",
    formatText: 'Formato esperado: {0}',

    initComponent: function () {
        this.callParent(arguments);

        this.on({
            render: this.parseDateToServer,
            change: this.maskDate,
            blur  : this.hideInvalidDate
        });
    },

    parseDateToServer: function (txt) {
        if(!this.getMainView()) { return }

        var vm = this.getMainViewModel(),
            dates = vm.get('dates'),
            fieldName;

        if (txt.bind && txt.bind.value) {
            fieldName = txt.bind.value.stub.name;

            if (!dates) {
                dates = [];
            }

            if (dates.indexOf(fieldName) == -1) {
                dates.push(fieldName);
                vm.set('dates', dates);
            }
        }
    },

    //coloca as barras na data enquanto o usuario digita
    maskDate: function (txt, newValue) {
        const rawValue = SamosUtils.String.onlyNumbers(txt.getRawValue());
        const rawValueChars = rawValue.split('');
            
        if(txt.readOnly || (rawValue.length == 8 && moment(newValue).isSameOrBefore('1900-01-01'))){
            this.hideInvalidDate(txt);
        } else {
            txt.suspendEvents();
            if (rawValueChars.length == 3 || rawValueChars.length == 4) {
                rawValueChars.splice(2, 0, '/');
    
            } else if (rawValueChars.length >= 5) {
                rawValueChars.splice(2, 0, '/');
                rawValueChars.splice(5, 0, '/');
            }
    
            txt.setRawValue(rawValueChars.join(''));
            Ext.defer(txt.resumeEvents, 50, txt);
        }
    },

    //esconde a data 30/12/1899 (para o firebird)
    hideInvalidDate: function(txt) {
        if(moment(txt.getValue()).isSameOrBefore('1900-01-01')){
            txt.setValue('1899-12-30');
            txt.setRawValue('');
        }
    }
});
