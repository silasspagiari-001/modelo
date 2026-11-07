Ext.define('SamosAdmin.consultas.graficoproduto.ViewController', { 
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.graficoproduto',

    init: function() {
        setTimeout(() => {
            this.getView().focus();
        }, 200);
    },

    onBuscarClick: async function(btn, e) {
        const txtProduto = this.lookup('produto');

        if(this.getViewModel().get('valueIdProduto')) {
            this.reconstruirGraficos();

            const store = this.getViewModel().getStore('main');

            store.currentPage = 1;
            store.getProxy().setUrl(this.getServerUrl());
            store.getProxy().setExtraParams(await this.getBuscarParams());
            
            this.getView().initGauge();

            return store.load()
                .then(records => {
                    if(this.aposBuscar) {
                        this.aposBuscar(records);
                    }
                    return records;
                })
                .catch((e) => {
                    console.error(e);
                    if(e && !e.aborted) {
                        Ext.Note('error', 'Erro no servidor');
                    }
                })
                .finally(() => {
                    if(this.getView()) { this.getView().stopGauge(); }
                });
        } else {
            Ext.Note('warning', 'Selecione o produto');
            Ext.defer(txtProduto.focus, 100, txtProduto, [true]);
        }
    },

    getServerUrl: function() {
        return 'server/consultas/graficoproduto';
    },

    getBuscarParams: function () {
        const vm = this.getViewModel();
        const exibeAnosAnteriores = vm.get('valueOpcoes');
        const anosExibidos = exibeAnosAnteriores ? 3 : 1;
        const anoFinal     = vm.get('valueAno');
        const anoInicial   = anoFinal - anosExibidos + 1;

        return {
            empresa: vm.get('valueEmpresa'),
            produto: vm.get('valueIdProduto'),
            inicio : momentTz(`${anoInicial}-01-01`).format('DD/MM/YYYY'),
            final  : momentTz(`${anoFinal  }-12-31`).format('DD/MM/YYYY')
        };
    },

    reconstruirGraficos: function() {
        const vm = this.getViewModel();
        const exibeAnosAnteriores = vm.get('valueOpcoes');
        const anosExibidos = exibeAnosAnteriores ? 3 : 1;
        const anoFinal     = vm.get('valueAno');

        for(let i = 0; i < anosExibidos; i++) {
            const ano = anoFinal - i;
            vm.set(`chartData${ano}`, []);
        }

        const graficos = (() => {
            return new Array(anosExibidos)
                .fill()
                .map((grafico, index) => {
                    const ano = anoFinal - index;
                    
                    return {
                        xtype: 'cartesian',
                        bodyPadding: '2 30 2 30',
                        height: exibeAnosAnteriores ? 200 : window.innerHeight - 235,
                        animation: true,
                        legend: true,
                        axes: [
                            {
                                title: ano.toString(),
                                type:  'numeric3d',
                                position:  'left',
                                fields:    ['VENDAS', 'COMPRAS'],
                                increment: 1,
                                minimum: 0
                            }, 
                            {
                                type: 'category3d',
                                fields: 'MES',
                                position: 'bottom',
                                renderer: function(axis, label){
                                    return Ext.Date.monthNames[label - 1].slice(0, 3);
                                }
                            }
                        ],
                        series: {
                            type: 'bar3d',
                            stacked: false,
                            xField: 'MES',
                            yField: ['VENDAS', 'COMPRAS'],
                            title: ['Vendas', 'Compras'],
                            style: {
                                minGapWidth: 20
                            },
                            subStyle: {
                                fill: ['red', '#0385BF'],
                                stroke: '#1F6D91'
                            },
                            label: {
                                field: ['VENDAS', 'COMPRAS'],
                                display: 'insideEnd'
                            }
                        },
                        bind: {
                            store: {
                                data: `{chartData${ano}}`,
                                autoLoad: true,
                                proxy: {
                                    type: 'memory'
                                },
                                fields: [
                                    'MES',
                                    'VENDAS',
                                    'COMPRAS'
                                ]
                            }
                        },
                    };
                });
        })();

        this.getView().query('cartesian').forEach(grafico => grafico.destroy());

        setTimeout(() => {
            this.lookup('groups').down('samoswidgets-defaultform').insert(1, graficos);
        }, 1);
    },

    aposBuscar: function(records) {
        const vm = this.getViewModel();
        const exibeAnosAnteriores = vm.get('valueOpcoes');
        const anosExibidos = exibeAnosAnteriores ? 3 : 1;
        const anoFinal     = vm.get('valueAno');
        const emptyData = {};

        for(let i = 0; i < anosExibidos; i++) {
            const ano = anoFinal - i;
            emptyData[ano] = new Array(12).fill()
                .map((mes, index) => {
                    mes = {
                        MES     : ((index + 1) % 12) || 12,
                        VENDAS : 0,
                        COMPRAS: 0,
                    }

                    return mes;
                });
        }

        const data = (records || []).reduce((result, mesRetornado) => {
            const mes = result[mesRetornado.get('ANO')].find(mes => {
                return mes['MES'] == mesRetornado.get('MES')
            });
            
            mes['VENDAS']  = mesRetornado.get('VENDAS');
            mes['COMPRAS'] = mesRetornado.get('COMPRAS');

            return result;
        }, emptyData);

        for(let i = 0; i < anosExibidos; i++) {
            const ano = anoFinal - i;
            vm.set('chartData' + ano, data[ano]);
        }
    }
});
