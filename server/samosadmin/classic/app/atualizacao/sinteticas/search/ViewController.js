Ext.define('SamosAdmin.atualizacao.sinteticas.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.sinteticassearch',

    getBuscarParams: function () {
        const vm = this.getViewModel();

        return {
            conteudo    : vm.get('valueConteudo'),
            ordem       : vm.get('valueOrdem'),
            tipo        : vm.get('valueTipo') == null ? '' : vm.get('valueTipo'),
            razao       : vm.get('valueRazao'),
            propriedades: vm.get('valuePropriedades') == null ? '' : vm.get('valuePropriedades'),
            produto     : vm.get('valueIdProduto') == null ? '' : vm.get('valueIdProduto'),
            isSearch    : 1
        };
    },

    onItemDblClick: async function (grid, record) {
        const view = this.getView();
        const parametrosSearchView = view.parametrosSearchView || {};

        try {
            const txt = view.txt;
            const visible = view.isVisible(true);
            const tipoApl = record.data['APLICACOES_STATUS'];
   
            //Se for chamado pelo list de sinteticas
            if( parametrosSearchView.modulo == 'sinteticas/list' ){
                if(tipoApl == 'A') {
                    if(!visible) { Ext.defer(() => txt.focus(true), 400) }
                    throw 'É preciso selecionar uma aplicação Sintética.';
                }

            }else{
                if(tipoApl == 'S') {
                    if(!visible) { Ext.defer(() => txt.focus(true), 400) }
                    throw 'Aplicação Sintética - não recebe lançamento';
                }
            }
                            
            this.callParent(arguments);
    
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao selecionar a aplicação');
        }

        view.stopGauge();
    }

});
