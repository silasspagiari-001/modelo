Ext.define('SamosAdmin.atualizacao.ceps.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.cepssearch',

    getServerUrl: function() {
        return 'server/consultas/ceps';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            conteudo: vm.get('valueConteudo'),
            cidade  : vm.get('valueCidade'),
            estado  : vm.get('valueEstado'),
            ordem   : vm.get('valueOrdem')
        };
    },

    onKeyDownCamposToolbar: function (txt, event) {
        this.callParent(arguments);

        if (txt && txt.fieldLabel == 'Conteúdo') {
            setTimeout(() => {
                if(txt.getValue() && txt.getValue().match('%')){
                    this.lookup('ordem').select(1);
                } else if(!this.selecaoManualEndereco) {
                    this.lookup('ordem').select(0);
                }
            }, 500);
        }
    },

    onCollapseCombo: function(txt) {
        setTimeout(() => {
            this.selecaoManualEndereco = txt.getValue() == 1;
        }, 500)
    },

    onChangeOrdem: function() {}
});
