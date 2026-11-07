Ext.define('SamosAdmin.movimentos.notaservicos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.notaservicos',

    constructor: function () {
        this.callParent(arguments);

        const title = 'Nota de Serviços Eletrônica';

        this.setData({
            valueInicio: momentServer().format('YYYY-MM-DD'),
            valueStatus: 6,
            valueTipo: 0
        });

        this.setFormulas({
            cpfcnpjFormatado: function(get) {
                const cpfCnpj         = get('gridnotaservicos.selection.ORDENS_CPFCNPJ') || '';
                const origemMovimento = (get('gridnotaservicos.selection.ORDENS_NUMEROORIGEM') + ' ' +
                                         get('gridnotaservicos.selection.ORDENS_SERIEORIGEM')) || '';

                return `${origemMovimento} - CPF/CNPJ: ${ SamosUtils.Format.cpfcnpj( SamosUtils.String.onlyNumbers(cpfCnpj) ) }`;
            },

            celularFormatado: function(get) {
                const numCelular = get('gridnotaservicos.selection.ORDENS_CELULAR')  || '';

                return `Celular: ${ Ext.util.Format.maskPhone( SamosUtils.String.onlyNumbers(numCelular) ) }`;
            },

            totalFormatado: function (get) {
                let valorTotal = get('gridnotaservicos.selection.TOTAL_MOVIMENTOS');
                let maskTotal = '';

                if(parseFloat(valorTotal) > 0) {
                    maskTotal = Ext.util.Format.MoneyMask.setMask('Total: R$ #9.999.990,00').mask(valorTotal)
                }

                return maskTotal;
            }
        });

        this.setStores({
            documentos: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.documentos.Model',
                proxy: {
                    url: 'server/documentos',
                    extraParams: {
                        ordem: 2,
                        status: 2,
                        start: 0,
                        limit: 9999
                    }
                }
            }
        });
    }
});
