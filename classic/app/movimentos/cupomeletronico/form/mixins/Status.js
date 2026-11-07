Ext.define('SamosAdmin.movimentos.cupomeletronico.form.mixins.Status', {
    extend: 'SamosModule.form.ViewController',

    onLiberarClick: function(btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente liberar o movimento?', btn => {
            if (btn == 'yes') {
                this.liberar();
            }
        });
    },

    liberar: function() {
        const model = this.getRecord();
        let status = model.get('MOVIMENTOS_STATUS');

        if(status == 'B'){//cancelado em uso
            status = 'C';
        } else if(status == 'M'){//nao faturado em uso
            status = 'N';
        } else if(status == 'E'){//faturado em uso
            status = 'F';
        }

        this.getView().initGauge('Liberando...');

        const data = { 'MOVIMENTOS_STATUS': status };

        model.set(data);

        SamosUtils.Request.nodeApi({
            url: `/cupomeletronico/${model.get('MOVIMENTOS_ID')}`,
            method: 'PUT',
            data: data
        })
        .done(res => {
            this.getView().stopGauge();
            Ext.Note('success', 'Movimento liberado');
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
