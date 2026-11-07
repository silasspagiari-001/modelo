Ext.define('SamosAdminModern.dashboard.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.dashboard',

    initViewModel: function() {
        Ext.asap(() => this.loadData());
    },

    validarEventoECarregar: function(txt, event) {
        this.loadData();
    },

    loadData: async function(){
        const view = this.getView(),
                vm = view.getViewModel(),
                store = vm.getStore('main'),
                grafico = view.lookupReference('grafico');

        const inicio  = this.lookupReference('inicio').getValue();
        const final   = this.lookupReference('final').getValue();

        if(
            new Date(inicio) == 'Invalid Date' &&
            new Date(final)  == 'Invalid Date'
        ) {
            throw 'Data inválida';
        }

        view.initGauge('Carregando Dados...');

        store.getProxy().setExtraParams({
            inicio: momentTz(inicio).format('YYYY-MM-DD'),
            final : momentTz(final).format('YYYY-MM-DD')
        });
        
        const yearsDiff = moment(inicio).diff( moment(final), 'years' );

        const records = await store.load();

        let htmlGrafico = `
            <table class='table-grafico'>
                <tr class='linha-header'>
                    <td class='coluna coluna-cabecalho coluna-cabecalho-filial texto'> Filial </td>
                    <td class='coluna coluna-cabecalho coluna-final valor'> Valor  </td>
                    <td class='coluna coluna-cabecalho texto coluna-barra'> Meta </td>
                </tr>
        `;
        let faturamentoMedio = 0;
        let faturamentoTotal = 0;

        for( let i = 0 ; i < records.length ; i++ )
        {   
            const recordAtual = records[i];
            faturamentoTotal += recordAtual.get('EMPRESAS_FATURAMENTO');
        }

        faturamentoMedio = faturamentoTotal / records.length;

        //Renderizar
        for( let i = 0 ; i < records.length ; i++ )
        {
            const clsRecord = records[i].get('EMPRESAS_FATURAMENTO') < faturamentoMedio ? 'texto-vermelho' : 'texto-azul';
            
            let barras = '';
            let qtdeMaximaBarras = 50;
            let regraDe3 = ( qtdeMaximaBarras * records[i].get('EMPRESAS_FATURAMENTO') ) / faturamentoTotal;

            //Se passar de 19 barras, ele mantem em 19
            if( regraDe3 > 19 ){ regraDe3 = 19 };

            let corBarra = clsRecord == 'texto-vermelho' ? 'barra-vermelha' : 'barra-azul';

            //Monta as barras
            for( let b = 0 ; b < regraDe3 ; b++ )
            {
                barras += `
                    <span class='${corBarra}'> <text class='${corBarra}'>.</text> </span>
                `;
            }

            htmlGrafico += `
            <tr>
                <td class='coluna coluna-filial ${ clsRecord }'> ${ records[i].get('EMPRESAS_FANTASIA').split(' - ')[1] }     </td>
                <td class='coluna coluna-valor coluna-final'>${ SamosUtils.Number.float2moeda( records[i].get('EMPRESAS_FATURAMENTO'), true ) } </td> 
                <td class='coluna coluna-barra'> ${barras} </td> 
            </tr>
            `
        }

        htmlGrafico += `
            </table>

            <table class='table-grafico'>
                <tr>
                    <td class='coluna coluna-valor texto-total'> Total </td>
                    <td class='coluna coluna-valor coluna-final valor-total'> ${ SamosUtils.Number.float2moeda( faturamentoTotal, true ) } </td>
                    <td class='coluna coluna-barra texto-total'> &nbsp </td>
                </tr>
            </table>
        `

        grafico.setHtml(htmlGrafico);
    },

    //https://plotly.com/javascript/bar-charts/
    /*
    createChart: async function(){
        let xValue = ['Product A', 'Product B', 'Product C'];

        let yValue = [20, 14, 23];

        let trace1 = {
            x: xValue,
            y: yValue,
            type: 'bar',
            text: yValue.map(String),
            textposition: 'auto',
            hoverinfo: 'none',
            marker: {
                color: 'rgb(158,202,225)',
                opacity: 0.6,
                line: {
                   color: 'rgb(8,48,107)',
                   width: 0.2
                }
            },
            orientation: 'h'
        };

        let data = [trace1];

        let layout = {
            title: 'Faturamento por Filial',
            barmode: 'stack',
            height: 400,
            yaxis: {fixedrange: true},
            xaxis : {fixedrange: true}
        };

        Plotly.newPlot('divGraficoDashboard', data, layout);
    },

    loadData: async function () {
        const view = this.getView();
        const thisController = this;
        const nomeFilial = configs.getEmpresa().nome.split(' - ')[0];

        try {
            const grafico = view.lookupReference('grafico');
            const store   = grafico.getStore();
            const inicio  = this.lookupReference('inicio').getValue();
            const final   = this.lookupReference('final').getValue();
    
            if(
                new Date(inicio) == 'Invalid Date' &&
                new Date(final)  == 'Invalid Date'
            ) {
                throw 'Data inválida';
            }

            view.initGauge('Carregando Dados...');

            store.getProxy().setExtraParams({
                inicio: momentTz(inicio).format('YYYY-MM-DD'),
                final : momentTz(final).format('YYYY-MM-DD')
            });
            
            const yearsDiff = moment(inicio).diff( moment(final), 'years' );

            let records = await store.load();
            //Encurta o nome da filial, mantendo apenas a sigla
            for( let i = 0 ; i < records.length ; i++ )
            {
                records[i].set('EMPRESAS_FANTASIA',  records[i].get('EMPRESAS_FANTASIA').replace(`${nomeFilial} - `, '') );
            }

            const max = Math.max.apply(null, recordsOrdenado.map(empresa => cents(empresa.get('EMPRESAS_FATURAMENTO'))))
            const total = records.reduce((total, empresa) => total + cents(empresa.get('EMPRESAS_FATURAMENTO')), 0) / 100;

            const totalizador = grafico.getSprites()[0];
            grafico.getAxes()[0].setMinimum(0);
            //grafico.getAxes()[0].setMaximum((max || 1) * 2.2 / 100);

            //const reducaoMax = (10000 ** yearsDiff);
            //grafico.getAxes()[0].setMaximum(( Math.abs(regra3_max) || 1) / 100);
            grafico.getAxes()[0].setMaximum((max || 1) * 2.2 / 100);

            //debugger;
            //grafico.getAxes()[0].setMaximum( ( (max - Math.abs(reducaoMax) ) || 1) / 100);

            totalizador.text = 'Total: ' + Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(total);
            grafico.setSprites(totalizador);
            grafico.updateLayout();
            

            

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao carregar dashboard');
        }

        view.stopGauge()
    },*/

    onVoltarClick: function() {
        /*
        const main = this.getView().up('main');
        
        main.down('image[reference="logo"]').show();
        main.down('panel').setActiveItem('menulist');
        main.down('container[reference="title"]').setHtml('Menu');
        main.getViewModel().set({
            hideVoltar : true,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        })
        */
    }
});
