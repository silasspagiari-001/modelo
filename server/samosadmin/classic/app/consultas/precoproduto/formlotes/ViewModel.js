Ext.define('SamosAdmin.consultas.precoproduto.formlotes.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formprecoslotes',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideSair: function(get) {
                return false;
            },
            promocoes: function(get) {
                const promocao = get('model.PROMOCOES')[0];
                
                if(promocao) {
                    const valorParcela = parseInt(cents(promocao['TOTALPARCELAS_ITENS']) / parseInt(promocao['PROMOCOESITENS_PARCELAS']));
                    
                    return {
                        nome: promocao['PROMOCOES_NOME'],
                        termino: 'Até: ' + momentTz(promocao['PROMOCOES_VALIDADE']).format('DD/MM/YYYY'),
                        desconto: Ext.util.Format.MoneyMask.setMask('%Desc #9.999.990,000').mask(promocao['DESCONTO_CALCULADO']),
                        partida: Ext.util.Format.MoneyMask.setMask('Partida #9.999.990,00').mask(promocao['PROMOCOESITENS_VALOR']),
                        parcelas: 'Parcelas ' + parseInt(promocao['PROMOCOESITENS_PARCELAS']),
                        valorParcela: Ext.util.Format.MoneyMask.setMask('Vlr.Parcela #9.999.990,00').mask(valorParcela / 100)
                    };
                } else {
                    return {};
                }
            }
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdmin.consultas.precoproduto.ModelLotes',
                autoLoad: true,
                data: '{model.LOTES}',
                proxy: {
                    type: 'memory'
                }
            },
            saldos: {
                type: 'nodejsstore',
                model: 'SamosAdmin.consultas.precoproduto.ModelSaldos',
                autoLoad: true,
                data: '{model.SALDOS}',
                proxy: {
                    type: 'memory'
                }
            }
        });
    } 
});
