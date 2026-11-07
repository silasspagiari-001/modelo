Ext.define('Ux.data.validator.Date', {
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.datevalidator',

    type: 'datevalidator',

    config: {
        message: 'Preencha a data corretamente',
        format: ''
    },

    validate: function(value) {
        if (!value) return true;

        var value = momentTz(value).format('YYYY-MM-DD'),
            matcher = this.buildMatcher(),
            result = matcher && matcher.test(value);

        return result ? result : this.getMessage();
    },

    buildMatcher: function () {
        var matcher = '^' + this.getFormat() + '$';

        matcher = matcher.replace('Y', '[0-9]{4}');
        matcher = matcher.replace('m', '(0[1-9]|1[0-2])')
        matcher = matcher.replace('d', '(0[1-9]|[1-2][0-9]|3[0-1])');

        return RegExp(matcher);
    }
});
