Ext.define('SamosAdmin.atualizacao.pessoas.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.pessoassearch',

    constructor: function () {
        this.callParent(arguments);

        let isRelCompras     = Ext.$('relatorioscompraslist')[0] ? true : false;        
        let isRomaneioMoveis = Ext.$('formromaneiosmoveis')[0] ? true : false;
        let isMontagem = (isRomaneioMoveis ? (Ext.$('formromaneiosmoveis')[0].getViewModel().get('isMontagem') ? true : false) : false);

        this.setData({
            valueTipo: configs.getClientName() == 'racaforte' ? 'A' :
                       configs.getClientName() == 'prudenmoveis' && isRomaneioMoveis && isMontagem ? 'M' :
                       configs.getClientName() == 'prudenmoveis' && isRomaneioMoveis && !isMontagem ? 'N' :
                       configs.getClientName() == 'prudenmoveis' && isRelCompras ? 'B' :
                       configs.getClientName() == 'prudenmoveis' && !isRomaneioMoveis ? 'A' : '',
            valueOrdem: configs.getPessoas().ordemBusca,
            valuePropriedades: configs.getPessoas().propriedades,
            valueStatus: 0
        });
    }
});
