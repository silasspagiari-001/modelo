Ext.define('SamosAdmin.movimentos.notaservicos.form.mixins.Status', {
    extend: 'SamosModule.form.ViewController',

    onLiberarClick: function(btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente liberar a nota de serviço?', btn => {
            if (btn == 'yes') {
                this.liberar();
            }
        });
    },

    liberar: function() {
        const model = this.getRecord();
        let status = model.get('ORDENS_STATUS');

        if(status == 'B'){//cancelado em uso
            status = 'C';
        } else if(status == 'M'){//nao faturado em uso
            status = 'N';
        } else if(status == 'E'){//faturado em uso
            status = 'F';
        }

        this.getView().initGauge('Liberando...');

        const data = { 'ORDENS_STATUS': status };

        model.set(data);

        SamosUtils.Request.nodeApi({
            url: `/notaservicos/${model.get('ORDENS_ID')}`,
            method: 'PUT',
            data: data
        })
        .done(res => {
            this.getView().stopGauge();
            Ext.Note('success', 'Nota de Serviço liberada');
        })
        .fail(err => {
            Ext.Note('error', 'Erro no servidor');
            console.error(err);
        });
    },

    save: function(model) {
        this.colocarFilhosNoModel(model);
        
        model.save()
            .then(this.onGravacaoSucesso.bind(this))
            .catch(this.onGravacaoFalha.bind(this))
            .finally(this.aposGravar.bind(this));
    }
});
