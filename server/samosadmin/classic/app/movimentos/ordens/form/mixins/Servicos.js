Ext.define('SamosAdmin.movimentos.ordens.form.mixins.Servicos', {
    extend: 'Ext.app.ViewController',

    prepararServico: function(txt, record) {
        const selection = this.lookup('servicos').getSelection();
        if(!selection){ return; }

        const txtQtde = txt.up('form').down('field[reference^="qtdeservico"]');
        const servico = selection.getValues();
        const preco = cents(record.get('SERVICOS_PRECO')); 

        servico['ORDENSSERVICOS_QUANTIDADE'] = (servico['ORDENSSERVICOS_QUANTIDADE'] == 0 ? 1 : servico['ORDENSSERVICOS_QUANTIDADE']);
        servico['ORDENSSERVICOS_PRECO']      = preco / 100;
        servico['ORDENSSERVICOS_TOTAL']      = preco / 100;

        txtQtde.suspendEvents();

        selection.setValues(servico);
        Ext.defer(txtQtde.resumeEvents, 50, txtQtde);

        setTimeout(() => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    },

    calcularServico: function(txt, griditems) {
        const selection = griditems.getSelection();
        
        if(!selection){ return; }

        const servico = selection.getValues();
        const qtdeIncompleta =  servico['ORDENSSERVICOS_QUANTIDADE'].toString().slice(-1) == '.'   ||
                                servico['ORDENSSERVICOS_QUANTIDADE'].toString().slice(-2) == '.0'  ||
                                servico['ORDENSSERVICOS_QUANTIDADE'].toString().slice(-3) == '.00';

        if(qtdeIncompleta) { return; }
        
        const qtde       = grams(servico['ORDENSSERVICOS_QUANTIDADE']);
        const preco      = toPrecision(servico['ORDENSSERVICOS_PRECO'], 4);
        const totalBruto = Math.round(qtde * preco / 100 / 1000);

        servico['ORDENSSERVICOS_TOTAL'] = totalBruto / 100;

        selection.setValues(servico);
    }
});