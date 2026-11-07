/*
 * Added:
 * This validator can receive a rule to validate presence
 * e.g:
 *  {
 *      name: "PESSOAS_EMISSOR",               
 *      validators: [
 *          {
 *              type: 'rule', 
 *              value1:'PESSOAS_NATUREZA', 
 *              operator:'==', 
 *              value2: 'Juridica', 
 *              allowEmpty: false,
 *              action: 'presence'
 *          }
 *      ]
 *  }
 *
 * It will allow blank "PESSOAS_EMISSOR" field if "PESSOAS_NATUREZA" field has "Juridica" value
 * Otherwise it will be required
 * 
 * "action: presence" make sure the field is fill, others make sure the field is valid
 */
Ext.define('Overrides.data.validator.Rule', {
    extend: 'Ext.data.validator.Presence',
    alias: 'data.validator.rule',

    type: 'rule',

    config: {
        message: 'Campo obrigatório',
        value1: '',
        value2: '',
        min: undefined,
        max: undefined,
        operator: '',
        multi: false,
        values: [],
        rules: [],
        test: '',
        action: 'presence' //action presence make sure the field is fill, others make sure the field is valid
    },
    
    validate: function(value, model) {
        if (this.getMulti()) {
            var values = this.getValues();
            var calcValues = [];
            var rules = this.getRules();
            var vars = [], field, valid;

            for (var i in values) {
                calcValues[i] = values[i];
                vars[i] = calcValues[i].match(/[[A-Z]+\_+[A-Z]+]/g);
                for (var j in vars[i]) {
                    field = vars[i][j].replace(/[/, '').replace(/]/, '');
                    value = model.get(field);

                    if (value && !!value.getTime) {
                        value = value.getTime();
                    }

                    if (parseFloat(value).toString() == 'NaN') {
                        value = "'" + value + "'";
                    }
                    calcValues[i] = calcValues[i].replace(/[A-Z]+\_+[A-Z]+/, value);
                }

                calcValues[i] = eval(calcValues[i]);
            }

            if (eval(this.getTest())) {
                return true;
                
            } else {
                return this.getMessage()
            }

        } else {
            var value1 = model.get(this.getValue1()) != undefined ? model.get(this.getValue1()) : this.getValue1(),
                value2 = model.get(this.getValue2()) != undefined ? model.get(this.getValue2()) : this.getValue2(),
                valid;

            if (!!value1.getTime) {
                value1 = value1.getTime();
            }

            if (!!value2.getTime) {
                value2 = value2.getTime();
            }

            if (parseFloat(value1).toString() == 'NaN') {
                value1 = "'" + value1 + "'";
            }

            if (parseFloat(value2).toString() == 'NaN') {
                value2 = "'" + value2 + "'";
            }

            valid = eval(value1 + this.getOperator() + value2) ? (this.getAction() == 'presence' ? true : false) : this.checkValue(value);

            return valid ? true : this.getMessage();
        }
    },

    checkValue: function (value) {
        var valid = !(value === undefined || value === null);

        if (this.getMin() != undefined) {
            valid = valid && (value >= this.getMin());
        }

        if (this.getMax() != undefined) {
            valid = valid && (value <= this.getMax());
        }

        if (valid && !this.getAllowEmpty()) {
            valid = !(value === '');
        }
        return valid
    }
});