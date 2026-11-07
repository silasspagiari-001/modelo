Ext.define('SamosAdmin.atualizacao.pessoas.form.propriedades.list.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'propriedades',

    requires: [
        'SamosAdmin.atualizacao.pessoas.form.propriedades.list.ViewModel',
        'SamosAdmin.atualizacao.pessoas.form.propriedades.list.ViewController'
    ],

    modelName:  'SamosAdmin.atualizacao.pessoas.form.propriedades.Model',//'Ext.data.Model',
    hidePaging: true,
    checkSelection: false, 

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            if (record.get('PROPRIEDADES_STATUS') == 'F') {
                return "inativo";
            }
        }
    },

    constructor: function() {        
        Ext.apply(this, {
            columns: [
                {
                    flex: false,
                    align: 'center',
                    width: 90,
                    text: 'Código',
                    dataIndex: 'PROPRIEDADES_ID'
                },
                {
                    flex: false,
                    width: 150,
                    text: 'Inscrição',
                    dataIndex: 'PROPRIEDADES_INSCRICAO'
                },
                {
                    flex: 2,
                    text: 'Endereço',
                    dataIndex: 'PROPRIEDADES_ENDERECO'
                },
                {
                    flex: 2,
                    text: 'Município',
                    dataIndex: 'CIDADES_NOMEPROPRIEDADE'
                },
                {
                    flex: 1,
                    text: 'UF',
                    dataIndex: 'CIDADES_ESTADOPROPRIEDADE'
                },
            ]
        });

        this.callParent(arguments);
    }
});
