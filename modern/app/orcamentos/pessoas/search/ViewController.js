Ext.define('SamosAdminModern.orcamentos.pessoas.search.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.orcamentospessoassearch',

    showButtons: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').hide();
        
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        })
    },

    onPesquisarClick: async function() {
        const view = this.getView();
        const vm = this.getViewModel();

        try {
            view.initGauge();

            let conteudo = vm.get('valueConteudo');
            let ordem = 0;

            if (conteudo && conteudo.substr(0, 1) == '*') {
                conteudo = conteudo.substr(1, 100).trim();
                ordem    = '1';
            } else if (SamosUtils.String.onlyNumbers(conteudo).length > 0) {
                conteudo = conteudo.trim();
                if (conteudo.length < 10 ) {
                    ordem = '1';
                } else {
                    ordem = '4';
                }
            }

            const store = vm.getStore('main');
            
            store.currentPage = 1;

            store.getProxy().setExtraParams({
                conteudo: conteudo,
                ordem   : ordem
            });

            store.load();

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao buscar')
        }

        view.stopGauge();
    },

    onItemClick: function (dataview, index, target, record, e) {
        const main = this.getView().up('main');
        
        main.down('panel').setActiveItem('orcamentosform');
        main.down('container[reference="title"]').setHtml('Orçamento');

        const movimento = main.down('panel').getActiveItem().getViewModel().get('model');

        movimento.set({
            'MOVIMENTOS_NOME'       : record.get('PESSOAS_NOME'),
            'MOVIMENTOS_ID_PESSOAS' : record.get('PESSOAS_ID'),
            'MOVIMENTOS_CPFCNPJ'    : record.get('PESSOAS_CPFCNPJ'),
            'PESSOAS_CPFCNPJ'       : record.get('PESSOAS_CPFCNPJ'),
            'CIDADES_NOME'          : record.get('CIDADES_NOME'),
            'CIDADES_ESTADO'        : record.get('CIDADES_ESTADO'),
            'PESSOAS_FANTASIA'      : record.get('PESSOAS_FANTASIA'),
            'MOVIMENTOS_EMAIL'      : record.get('PESSOAS_EMAIL'),
            'PESSOAS_TELEFONE'      : record.get('PESSOAS_TELEFONE'),
            'MOVIMENTOS_CELULAR'    : record.get('PESSOAS_CELULAR'),
            'PESSOAS_ENDERECO'      : record.get('PESSOAS_ENDERECO'),
            'PESSOAS_NUMERO'        : record.get('PESSOAS_NUMERO'),
            'PESSOAS_BAIRRO'        : record.get('PESSOAS_BAIRRO'),
            'PESSOAS_CEP'           : record.get('PESSOAS_CEP'),
            'PESSOAS_ID_CIDADES'    : record.get('PESSOAS_ID_CIDADES'),
            'PESSOAS_CREDITO'       : record.get('PESSOAS_CREDITO'),
            'PESSOAS_TIPO'          : record.get('PESSOAS_TIPO'),
            'PESSOAS_INSCRICAO'     : record.get('PESSOAS_INSCRICAO'),
            'PESSOAS_ID_USUARIOS'   : record.get('PESSOAS_ID_USUARIOS'),
            'USUARIOS_NOMEVENDEDOR' : record.get('USUARIOS_NOMEVENDEDOR')
        });

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : false,
            hideNovo   : true
        });
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('orcamentosform');
        main.down('container[reference="title"]').setHtml('Orçamento');

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : false,
            hideNovo   : true
        });
    }
});
