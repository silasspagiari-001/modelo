Ext.define('SamosAdmin.atualizacao.ncms.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formncms',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            difalDefault: '[{"ID":1,"UF":"AC","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":2,"UF":"AL","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":3,"UF":"AP","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":4,"UF":"AM","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":5,"UF":"BA","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":6,"UF":"CE","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":7,"UF":"DF","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":8,"UF":"ES","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":9,"UF":"GO","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":10,"UF":"MA","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":11,"UF":"MT","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":12,"UF":"MS","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":13,"UF":"MG","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":14,"UF":"PA","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":15,"UF":"PB","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":16,"UF":"PR","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":17,"UF":"PE","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":18,"UF":"PI","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":19,"UF":"RJ","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":20,"UF":"RN","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":21,"UF":"RS","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":22,"UF":"RO","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":23,"UF":"RR","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":24,"UF":"SC","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":25,"UF":"SP","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":26,"UF":"SE","IVA":0,"DIV":0,"FCP":0,"DIF":0},{"ID":27,"UF":"TO","IVA":0,"DIV":0,"FCP":0,"DIF":0}]'
        })

        this.setFormulas({
            dataDifal: function(get){
                return get('model.NCMS_DIFAL') || get('difalDefault');
            },

            dataDifalA: function(get) {
                const difal = SamosUtils.Json.tryJsonToObj(get('dataDifal')) || [];
                return difal.slice(0, 9);
            },
            dataDifalB: function(get) {
                const difal = SamosUtils.Json.tryJsonToObj(get('dataDifal')) || [];
                return difal.slice(9, 18);
            },
            dataDifalC: function(get) {
                const difal = SamosUtils.Json.tryJsonToObj(get('dataDifal')) || [];
                return difal.slice(18, 27);
            }
        });
    },

    stores: {
        difalA: {
            type: 'nodejsstore',
            model: 'SamosAdmin.atualizacao.ncms.ModelDifal',
            autoLoad: true,
            data: '{dataDifalA}',
            proxy: {
                type: 'memory'
            }
        },
        difalB: {
            type: 'nodejsstore',
            model: 'SamosAdmin.atualizacao.ncms.ModelDifal',
            autoLoad: true,
            data: '{dataDifalB}',
            proxy: {
                type: 'memory'
            }
        },
        difalC: {
            type: 'nodejsstore',
            model: 'SamosAdmin.atualizacao.ncms.ModelDifal',
            autoLoad: true,
            data: '{dataDifalC}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
