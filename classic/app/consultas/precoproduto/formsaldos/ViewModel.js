Ext.define('SamosAdmin.consultas.precoproduto.formsaldos.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formprecossaldos',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({

            hideFotos: function (get) {
                return !configs.getProdutos().fotos
            },

            hideSair: function(get) {
                return false;
            },

            promocoes: function(get) {
                const promocao = get('model.PROMOCOES')[0];
                
                if(promocao) {
                    if(configs.getMovimentos().promocaoBasica) {
                        return {
                            nome: promocao['PROMOCOES_NOME'],
                            termino: 'Até: ' + momentTz(promocao['PROMOCOES_VALIDADE']).format('DD/MM/YYYY'),
                            partida: 'Promoção\n' + Ext.util.Format.MoneyMask.setMask('#99.990,00').mask(promocao['PROMOCOESITENS_VALOR'])
                        };
                    } else {
                        const precoTabela = cents(get('model.PRECO')) > 0 ? get('model.PRECO') : get('model.SALDOS_PRECO');
                        const valorDesconto = (cents(precoTabela) - cents(promocao['PROMOCOESITENS_VALORB'])) / 100;
                        if(configs.getUsuario().privilegiado) {
                            return {
                                nome: promocao['PROMOCOES_NOME'],
                                termino: 'Até: ' + momentTz(promocao['PROMOCOES_VALIDADE']).format('DD/MM/YYYY'),
                                partida:  'R$ Pix/Din\n' + Ext.util.Format.MoneyMask.setMask('#99.990,00').mask(promocao['PROMOCOESITENS_VALOR']),
                                partidaA: 'R$ 1x a 3x\n' + Ext.util.Format.MoneyMask.setMask('#99.990,00').mask(promocao['PROMOCOESITENS_VALORA']),
                                partidaB: 'R$ 4x a 10x\n'+ Ext.util.Format.MoneyMask.setMask('#99.990,00').mask(promocao['PROMOCOESITENS_VALORB']),
                                partidaC: 'R$ 11 e 12x\n'+ Ext.util.Format.MoneyMask.setMask('#99.990,00').mask(promocao['PROMOCOESITENS_VALORC'])
                            };    
                        } else {
                            return {
                                nome: promocao['PROMOCOES_NOME'],
                                termino: 'Até: ' + momentTz(promocao['PROMOCOES_VALIDADE']).format('DD/MM/YYYY'),
                                partida:  'TB Vista\n'  + Ext.util.Format.MoneyMask.setMask('#99.990,00').mask(precoTabela),
                                partidaA: 'Promoção\n' + Ext.util.Format.MoneyMask.setMask('#99.990,00').mask(promocao['PROMOCOESITENS_VALORB']),
                                partidaB: 'Desconto\n'+ Ext.util.Format.MoneyMask.setMask('#99.990,00').mask(valorDesconto),
                                partidaC: ''
                            };
                        }    
                    }
                } else {
                    return {};
                }
            }
            
        });

        this.setStores({
            main: {
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
