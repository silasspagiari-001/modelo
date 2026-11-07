Ext.define('SamosAdmin.dashboard.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.samosdashboard',

    initViewModel: function() {
        Ext.asap(() => this.loadData());
    },

    validarEventoECarregar: function(txt, event) {
        if(txt.rawValue.length == 10) {
            this.loadData();
        }
    },

    loadData: async function () {
        const view = this.lookup('panelfaturamento');

        try {
            const store   = this.getViewModel().get('faturamento');
            const grafico = this.lookup('chart');
            const inicio  = this.lookup('inicio').getValue();
            const final   = this.lookup('final').getValue();
    
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
            
            const records = await store.load();

            const max = Math.max.apply(null, records.map(empresa => cents(empresa.get('EMPRESAS_FATURAMENTO'))))
            const total = records.reduce((total, empresa) => total + cents(empresa.get('EMPRESAS_FATURAMENTO')), 0) / 100;
            const totalizador = grafico.getSprites()[0];

            grafico.getAxes()[0].setMinimum(0);
            grafico.getAxes()[0].setMaximum((max || 1) * 2.2 / 100);
            totalizador.text = 'Total: ' + Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(total);
            grafico.setSprites(totalizador);
            grafico.updateLayout();

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao carregar dashboard');
        }

        view.stopGauge()
    },

    onSeriesLabelRender: function (value, a, b, c, d, e, f) {
        return Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(value);
    },

    onAxisLabelRender: function (axis, label, layoutContext) {
        return Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(layoutContext.renderer(label)) + '  ';
    },

    onAxisCategoryRender: function (axis, label, layoutContext) {
        return (label || '').indexOf('-') != -1 ? (label || '').substr((label || '').indexOf('-') + 2, Infinity) : label;
    },

    onColumnRender: function (sprite, config, data, index) {
        const faturamento = cents(data.store.data.items[index].get('EMPRESAS_FATURAMENTO'));
        const faturamentoMedio = data.store.data.items.reduce((total, empresa) => {
            return total += cents(empresa.get('EMPRESAS_FATURAMENTO'));
        }, 0) / data.store.data.items.length;

        return { 
            fillStyle: faturamento >= faturamentoMedio ? '#0385BF' : 'red'
        };
    },

    onTooltipRender: function (tooltip, record, item) {
        tooltip.setHtml(
            record.get('EMPRESAS_FANTASIA') + ': ' +
            Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(record.get('EMPRESAS_FATURAMENTO'))
        );
    }
});
