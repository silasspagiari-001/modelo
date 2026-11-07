Ext.define('SamosAdmin.movimentos.movimento.services.Sms', {
    alternateClassName: 'Movimento.services.Sms',
    singleton: true,

    criarJanela: async function(form) {
        const titulo = form.title;
        const server = configs.getApiNode();

        let defaultNumero = SamosUtils.String.onlyNumbers(form.model.get('MOVIMENTOS_CELULAR') || '').toString();

        if(defaultNumero.length == 8){
            defaultNumero = '55189' + defaultNumero;
        } else if(defaultNumero.length == 9){
            defaultNumero = '5518' + defaultNumero;
        } else if(defaultNumero.length == 10){
            defaultNumero = '55' + defaultNumero.slice(0,2) + '9' + defaultNumero.slice(2,10);
        } else if(defaultNumero.length == 11){
            defaultNumero = '55' + defaultNumero;
        }

        const numero = await SamosUtils.Msg.prompt('SMS', 'Confirme ou digite o numero:', defaultNumero);
        
        if(numero === false) { return; }//cancelado pelo usuario

        form.initGauge('Enviando sms...');

        try {
            const pdf = await this.imprimir(form);

            if(!pdf){
                throw 'Erro na geração do pdf';
            }
        
            await SamosUtils.Sms.enviar({
                numero: numero,
                msg:    `Baixe seu ${titulo} aqui: ${server}/${pdf}`,
                view:   form
            });

            Ext.Note('success', 'SMS enviado com sucesso');
        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao enviar SMS');
        }

        form.stopGauge();
    },

    imprimir: async function(form) {
        const movimento = form.model;
        const formTitle = form.title;

        if(!movimento.get('DOCUMENTOS_LAYOUT')) { resolve(); }

        const layout = movimento.get('DOCUMENTOS_LAYOUT');

        const queryPDF = await SamosUtils.Request.nodeApi({
            url: `/relatorios/${configs.getClientName()}/${layout}`,
            method: 'GET',
            query: {
                id            : movimento.get('MOVIMENTOS_ID'),
                empresa       : configs.getEmpresa(),
                documento     : movimento.get('MOVIMENTOS_ID_DOCUMENTOS'),
                numero        : movimento.get('MOVIMENTOS_NUMERO'),
                start         : 0,
                limit         : 1,
                titledocumento: formTitle,
                diasvctorodape: configs.getMovimentos().exibirDiasVctoRodape
            }
        });

        return queryPDF.results[0]['name']
    }
});
