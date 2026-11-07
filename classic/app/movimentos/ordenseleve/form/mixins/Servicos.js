Ext.define('SamosAdmin.movimentos.ordenseleve.form.mixins.Servicos', {
    extend: 'Ext.app.ViewController',

    prepararServico: function(txt, record) {
        const selection = this.lookup('servicos').getSelection();
        if(!selection){ return; }

        const txtQtde = txt.up('form').down('field[reference^="qtde"]');
        const txtHrl  = txt.up('form').down('field[reference^="diarialocal"]');
        const txtHri  = txt.up('form').down('field[reference^="diariainicio"]');
        const txtHrf  = txt.up('form').down('field[reference^="diariafinal"]');

        txtHrl.setValue('07:30');
        txtHri.setValue('00:00');
        txtHrf.setValue('00:00');

        const servico = selection.getValues();
        const preco = cents(record.get('SERVICOS_PRECO'));
        servico['ITEM_DATA'] = momentServer().format('YYYY-MM-DD');
        servico['ORDENSSERVICOS_PRECO'] = preco / 100;
        servico['ORDENSSERVICOS_TOTAL'] = preco / 100;
        
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

        let hrInicio  = servico['ITEM_HORAINICIO'] == 'hh:mm' ? '' : servico['ITEM_HORAINICIO'];
        let hrTermino = servico['ITEM_HORAFIM']    == 'hh:mm' ? '' : servico['ITEM_HORAFIM'];

        if(hrInicio && hrTermino) {
   
            let ms = moment(hrTermino, "HH:mm").diff(moment(hrInicio, "HH:mm"));
            let  d = moment.duration(ms);
            let tempo = d.hours() + ":" + d.minutes().toString().padStart(2, '0');
    
            servico['ITEM_TEMPO'] = tempo;
            servico['ORDENSSERVICOS_QUANTIDADE'] = parseInt(tempo.split(':')[0]) + (parseInt(tempo.split(':')[1]) > 0 ? 0.5 : 0);
        } else {
            servico['ITEM_TEMPO'] = '00:00';
            servico['ORDENSSERVICOS_QUANTIDADE'] = 0;
        }

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