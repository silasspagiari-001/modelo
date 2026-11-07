Ext.define('SamosAdmin.atualizacao.pessoas.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.pessoassearch',

    afterLoadMainStore: async function(store, records, success, operation) {
        const view = this.getView().down('grid tableview');
        const tipos = configs.getPessoas().tipos;

        records.forEach((record, index) => {
            const tipo = tipos.find(list => list[0] == record.get('PESSOAS_TIPO'))

            if (tipo) {
                try {
                    view.getRow(index).style.color = tipo[2] || 'black';
                } catch(e){}
            }
        })
    },

    onItemDblClick: async function (grid, record) {

        try {
            const isMovimento = !!Ext.$('formmovimentos')[0];
            const isNotaConsumidor = !!Ext.$('formnotaconsumidor')[0];

            if(isNotaConsumidor) { // Nota Consumidor - Testar bloqueio
                if(record.get('PESSOAS_CPFCNPJ').length > 11) {
                    throw 'Nota Consumidor só é permitida pra Cliente Pessoa Física';
                }
            }

            const multiPropriedades = (record.get('PESSOAS_PROPRIEDADES') || []);
            const qtdePropriedades = multiPropriedades.length;
            if(qtdePropriedades > 1 && configs.getMovimentos().autoEnvioSefaz && isMovimento) {
                const janelaPropriedades = Ext.create({
                    xtype: 'propriedadessearch',
                    title: 'Propriedades ' + record.get('PESSOAS_NOME')
                });
    
                janelaPropriedades.getViewModel().set({
                    model: record
                });
            } else {
                if(cents(record.get('ID_PROPRIEDADE')) > 0 && record.get('PROPRIEDADES_STATUS') == 'F' && isMovimento) {
                    throw 'Cliente sem propriedades ativas';
                } else {
                    this.setValues(record);
                }
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao selecionar pessoa');
        }        
    },

    onSelecionarClick: function (btn, event) {
        const records = this.getView().down('grid').getSelectionModel().getSelection();
        const txt = this.getView().txt;
        const multiPropriedades = (records[0].get('PESSOAS_PROPRIEDADES') || []).length > 1;

        if(multiPropriedades && configs.getMovimentos().autoEnvioSefaz) {
            Ext.Note('warning', 'Escolha uma das propriedades da pessoa');
        } else {
            if (records[0]) {
                if(this.getView().checkSelection && txt.up('samoswidgets-griditems')) {
                    this.adicionarMultiplosItens(txt, records);
                } else {
                    this.onItemDblClick(null, records[0]);
                }
            } else {
                Ext.Note('warning', 'Escolha um registro');
            }    
        }
    }
});
