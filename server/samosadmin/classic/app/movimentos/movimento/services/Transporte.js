Ext.define('SamosAdmin.movimentos.movimento.services.Transporte', {
    alternateClassName: 'Movimento.services.Transporte',
    singleton: true,

    validar: function() {

        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');

        const calculaPesoAutomatico =
            configs.getMovimentos().calculaPesoNfe &&
            movimento.get('DOCUMENTOS_COLETATRANSPORTE') == 'F';

        /*
        * Mesmo sem coleta de transporte, se o peso da NF-e é automático,
        * precisamos manter MOVIMENTOS_ENVIO para gravar os pesos.
        */
        if(calculaPesoAutomatico) {
            this.finalizarPesoAutomatico();
            return true;
        }        

        const obrigatorio = this.obrigatorio();
        const valido = this.valido();

        if(obrigatorio && valido) {
            this.finalizar();
            return true;
        } else if(obrigatorio && !valido) {
            this.exibir();
            return false;
        } else {
            this.limpar();
            return true;          
        }
    },

    obrigatorio: function() {
        const form = Ext.$('formmovimentos')[0];
        return form.getViewModel().get('transporteObrigatorio');
    },

    valido: function() {
        return this.existe() && this.verificado();
    },

    existe: function() {
        return !!this.get();
    },

    get: function() {
        const form = Ext.$('formmovimentos')[0];
        const janelaTransporte = Ext.$('formmovimentostransporte')[0];
        const listTransportes = form.getViewModel().get('model.MOVIMENTOS_ENVIO');

        if(janelaTransporte && janelaTransporte.isVisible(true)){
            const transporte = janelaTransporte.getViewModel().get('model');
            return transporte.data;
        } else if(listTransportes){
            return listTransportes[0];
        } else {
            return null;
        }
    },

    verificado: function() {
        const temId = this.get()['MOVIMENTOSENVIO_ID_TRANSPORTES'] > 0

        const modoValido = this.get()['MOVIMENTOSENVIO_MODO'] && 
                          (this.get()['MOVIMENTOSENVIO_MODO'] == 'F' ||
                           this.get()['MOVIMENTOSENVIO_MODO'] == 'C' ||
                           this.get()['MOVIMENTOSENVIO_MODO'] == 'T' ||
                           this.get()['MOVIMENTOSENVIO_MODO'] == 'S' ||
                           this.get()['MOVIMENTOSENVIO_MODO'] == 'D');
                           
        const placaUfValida = (this.get()['MOVIMENTOSENVIO_PLACA'] && this.get()['MOVIMENTOSENVIO_PLACAUF']) ||
                              (!this.get()['MOVIMENTOSENVIO_PLACA'] && !this.get()['MOVIMENTOSENVIO_PLACAUF']);

        if(!modoValido) {
            Ext.Note('warning', 'Informe o modo de transporte');
        }

        if(!placaUfValida) {
            Ext.Note('warning', 'Informe a placa válida');
        }

        return (temId && placaUfValida && modoValido);
    },

    finalizar: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const transporte = this.get();
        this.removerMascaras(transporte);
        movimento.set('MOVIMENTOS_ENVIO', [transporte]);
    },

    finalizarPesoAutomatico: function() {
        const form = Ext.$('formmovimentos')[0];
        const vm = form.getViewModel();
        const movimento = vm.get('model');
        const ctrlMovimento = form.getController();

        let transporte = movimento.get('MOVIMENTOS_ENVIO');

        /*
        * Se não existir MOVIMENTOS_ENVIO, cria o registro padrão.
        */
        if(!transporte || !transporte[0]) {
            transporte = [
                Ext.create(
                    'SamosAdmin.movimentos.movimento.form.transporte.Model',
                    { 'MOVIMENTOSENVIO_ID': -1 }
                ).data
            ];
        }

        /*
        * Para esta situação o peso informado manualmente é ignorado.
        * Sempre prevalece o cálculo dos produtos.
        */
        const pesos = ctrlMovimento.calcularPesoNfe();

        transporte[0]['MOVIMENTOSENVIO_PESOBRUTO'] =
            Number(pesos.pesoBruto || 0);

        transporte[0]['MOVIMENTOSENVIO_PESOLIQUIDO'] =
            Number(pesos.pesoLiquido || 0);

        this.removerMascaras(transporte[0]);            

        movimento.set('MOVIMENTOS_ENVIO', transporte);

        vm.set('pesoNfeInformadoManual', false);
    },    

    removerCamposLocais: function(transporte) {
        Object.keys(transporte).filter(campo => {
            return campo.split('_')[0] != 'MOVIMENTOSENVIO';
        }).forEach(campo => {
            delete transporte[campo];
        });
    },

    removerMascaras: function(transporte) {
        var camposComMascara = [
            'MOVIMENTOSENVIO_CPFCNPJ',
            'MOVIMENTOSENVIO_CEP'
        ];

        camposComMascara.forEach(campo => {
            transporte[campo] = SamosUtils.String.onlyNumbers(transporte[campo]);
        });
    },

    exibir: function() {
        const janelaTransporte = Ext.$('formmovimentostransporte')[0];

        try {
            janelaTransporte.focus();
        } catch (e) {
            this.criarJanela();
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const modelTransporte = Ext.create(
            'SamosAdmin.movimentos.movimento.form.transporte.Model', 
            Ext.Object.merge({ 'MOVIMENTOSENVIO_ID': -1 }, movimento.get('MOVIMENTOS_ENVIO')[0])
        );
        const viewTransporte = Ext.create({
            xtype: 'formmovimentostransporte'
        });
        
        viewTransporte.getViewModel().set({
            movimento: movimento,
            model: modelTransporte,
            readOnly: form.getViewModel().get('readOnly')
        });

        viewTransporte.focus(true);
        form.add(viewTransporte);
    },
    
    limpar: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        
        movimento.set('MOVIMENTOS_ENVIO', []);
    }
});
