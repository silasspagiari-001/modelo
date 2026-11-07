Ext.define('SamosAdmin.atualizacao.pessoas.form.propriedades.list.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.propriedades',

    onNovoClick: async function (btn, event) {

        const pessoa = this.getRecord();        
        const record = Ext.create('SamosAdmin.atualizacao.pessoas.form.propriedades.Model'); 

        record.set({
            'PROPRIEDADES_ID_PESSOAS' : pessoa.get('PESSOAS_ID'),
            'PROPRIEDADES_NOME'       : pessoa.get('PESSOAS_NOME')
        });

        const view = Ext.create({
            xtype: 'formpropriedades'
        });

        view.getViewModel().set({
            readOnly: false,
            model: record
        });

        view.lookup('cpf').focus(true);

    },

    onItemDblClick: async function(grid, record) {

        const view = Ext.create({
            xtype: 'formpropriedades'
        });

        view.getViewModel().set({
            'initialValues': record.getData(),
            'previousModel': undefined,
            model: record,
            readOnly: true
        });
    
    }
});
