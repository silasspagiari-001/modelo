Ext.define('SamosAdmin.atualizacao.documentos.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formdocumentos',

    onGravarClick: async function () {
        const model = this.getRecord();

        await this.validarCabecalho();

        if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')){
            try {
                this.getView().initGauge('Gravando...');
                this.colocarFilhosNoModel(model);
                const modelSalvo = await model.save();
                this.onGravacaoSucesso(modelSalvo);
            } catch (error) {
                this.onGravacaoFalha(error);
            }
            this.aposGravar();

            if(this.getView().resolve) {
                this.getView().resolve(model, this.getView())
            }
        }
    },

    onGravacaoSucesso: function (record) {
        Ext.Note('success', 'Gravado com sucesso');
        this.finalizarEdicao();
        Ext.defer(this.getViewModel().set, 600, this.getViewModel(), ['forceChangeId', Math.random()]);

        this.getViewModel().set('initialValues', Object.assign({}, record.data));
        record.store = true;//para mostrar que ja esta gravado
        
        setTimeout(() => {
            this.setReadOnly(true);

            //Atualiza os dados da ultima serie do localstorage
            const nomeDocumentoTratado = String(record.get('DOCUMENTOS_NOME')).toUpperCase();
            const numeroDocumento      = String(record.get('DOCUMENTOS_ULTIMO'));
            const serieDocumento       = String(record.get('DOCUMENTOS_SERIE'));

            //Se for cupom eletronico
            if( nomeDocumentoTratado == 'CUPOM ELETRONICO' ){
                localStorage.setItem('ultimoNumeroCFE', numeroDocumento);
                localStorage.setItem('ultimaSerieCFE',  serieDocumento);

            //Se for nota eletronica
            }else if( nomeDocumentoTratado == 'NOTA ELETRÔNICA' ){
                localStorage.setItem('ultimoNumeroNFE', numeroDocumento);
                localStorage.setItem('ultimaSerieNFE',  serieDocumento);
            //Se for nota consumidor
            }else if( nomeDocumentoTratado == 'NOTA CONSUMIDOR' ){
                localStorage.setItem('ultimoNumeroNFC', numeroDocumento);
                localStorage.setItem('ultimaSerieNFC',  serieDocumento);
            }

        }, 100);
    }
});
