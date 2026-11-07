Ext.define('SamosAdmin.atualizacao.propriedades.search.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.propriedadessearch',

    onSelecionarClick: async function (btn, event) {
        const records = this.getView().down('grid').getSelectionModel().getSelection();
        if (records[0]) {
          this.onItemDblClick(null, records[0]);
        } else {
          Ext.Note('warning', 'Escolha um registro');
        }
    },

    onItemDblClick: async function (grid, record) {
        const view = this.getView();

        try {

            if(record.data['PROPRIEDADES_STATUS'] == 'F') {
                throw 'Esta propriedade está inativa';
            }

            const idPropriedade       = record.data['PROPRIEDADES_ID'];
            const idPessoaPropriedade = record.data['PROPRIEDADES_ID_PESSOAS'];
            const nomPropriedade      = record.data['PROPRIEDADES_NOME'];
            const cnpPropriedade      = record.data['PROPRIEDADES_CPFCNPJ'];
            const iePropriedade       = record.data['PROPRIEDADES_INSCRICAO'];
            const endPropriedade      = record.data['ENDERECO_COMPLETO'];
            const telPropriedade      = record.data['PROPRIEDADES_TELEFONE'];
            const celPropriedade      = record.data['PROPRIEDADES_CELULAR'];
            const munPropriedade      = record.data['CIDADES_NOMEPROPRIEDADE'];
            const ufPropriedade       = record.data['CIDADES_ESTADOPROPRIEDADE'];
            const classeCadastro      = record.data['CLASSE_CADASTRO'];
            const obsCadastro         = record.data['PESSOAS_OBSERVACOES'];

            const formMovimento = Ext.$('formmovimentos')[0];            
            const movimento = formMovimento.getViewModel().get('model') || [];
            const formBusca = Ext.$('pessoassearch')[0];            
            movimento.set('MOVIMENTOS_ID_PROPRIEDADES', idPropriedade);
            movimento.set('PROPRIEDADES_ID_PESSOAS', idPessoaPropriedade);
            movimento.set('MOVIMENTOS_ID_PESSOAS', idPessoaPropriedade);
            movimento.set('MOVIMENTOS_NOME', nomPropriedade);            
            movimento.set('MOVIMENTOS_CPFCNPJ', cnpPropriedade);
            movimento.set('PROPRIEDADES_CPFCNPJ', cnpPropriedade);
            movimento.set('PROPRIEDADES_INSCRICAO', iePropriedade);
            movimento.set('PROPRIEDADES_ENDERECO', endPropriedade);
            movimento.set('CIDADES_NOMEPROPRIEDADE', munPropriedade);
            movimento.set('CIDADES_ESTADOPROPRIEDADE', ufPropriedade);
            movimento.set('PROPRIEDADES_TELEFONE', telPropriedade);
            movimento.set('MOVIMENTOS_CELULAR', celPropriedade);
            movimento.set('CLASSE_CADASTRO', classeCadastro);
            movimento.set('PESSOAS_ID', idPessoaPropriedade);
            movimento.set('PESSOAS_NOME', nomPropriedade);
            movimento.set('PESSOAS_OBSERVACOES', obsCadastro);

            setTimeout(() => formBusca.getController().setValues(record), 500);
            setTimeout(() => formBusca.getController().onSairClick(), 500);
//            setTimeout(() => formMovimento.getController().aposBuscarPessoa(), 500);            
            this.onSairClick();
    
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao selecionar a propriedade');
        }

        view.stopGauge();
    }

});
