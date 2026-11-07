Ext.define('SamosAdmin.atualizacao.pessoas.form.assistencias.list.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.assistencias',

    onNovoClick: async function (btn, event) {

        const pessoa = this.getRecord();        
        const record = Ext.create('SamosAdmin.atualizacao.pessoas.form.assistencias.Model');

        record.set({
            'ORDENS_ID_PESSOAS' : pessoa.get('PESSOAS_ID'),
            'ORDENS_NOME'       : pessoa.get('PESSOAS_NOME').slice(0, 50)
        });

        const view = Ext.create({
            xtype: 'formassistencias'
        });

        view.getViewModel().set({
            readOnly: false,
            model: record
        });

        view.lookup('cpf').focus(true);

    },

    onItemDblClick: async function(grid, record) {

        const view = Ext.create({
            xtype: 'formassistencias'
        });

        view.getViewModel().set({
            'initialValues': record.getData(),
            'previousModel': undefined,
            model: record,
            readOnly: true
        });
    
    }
});
