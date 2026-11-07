Ext.define('SamosAdmin.movimentos.promocoes.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.promocoes',

    onNovoClick: async function(btn, event) {
        const cfgPromocao = configs.getMovimentos().promocao;

        const form = await this.callParent(arguments);

        await SamosUtils.Utils.sleep(300);

        if(cfgPromocao) {
            form.model.set({
                'PROMOCOES_EMPRESAS'    : cfgPromocao['PROMOCOES_EMPRESAS'],
                'PROMOCOES_CUSTOTECNICO': cfgPromocao['PROMOCOES_CUSTOTECNICO'],
                'PROMOCOES_DESCONTO'    : cfgPromocao['PROMOCOES_DESCONTO'],
                'PROMOCOES_INDICE'      : cfgPromocao['PROMOCOES_INDICE'],
                'PROMOCOES_PARCELAS'    : cfgPromocao['PROMOCOES_PARCELAS'],
            });
        }

        return form;
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            numero  : vm.get('valueNumero'),
            conteudo: vm.get('valueConteudo'),
            inicio  : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final   : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem   : vm.get('valueOrdem'),
            status  : vm.get('valueStatus')
        };
    },

    onItemDblClick: async function(grid, record) {
        this.getView().initGauge();
        
        const modelCompleto = await Promocao.services.Model.get(record.get('PROMOCOES_ID'));
        
        if(modelCompleto) {
            await this.createForm(modelCompleto[0], true, this.getView());
        }

        this.getView().stopGauge();
    },

    onAlterarInicioValidadeClick: async function() {
        try {

            const promocoes = this.getView().down('grid').getSelectionModel().getSelection();
            const inicio    = momentTz(this.lookup('inicio').getValue()).format('DD.MM.YYYY');
            const validade  = momentTz(this.lookup('final').getValue()).format('DD.MM.YYYY');
                   
            if(!promocoes[0]){
                throw 'Selecione a(s) promoção(ões)';
            }
            
            if(await SamosUtils.Msg.confirm('Deseja realmente alterar o início/validade para ' + inicio + '/' + validade)){
                const idsPromocoes = promocoes.map(promocao => promocao.get('PROMOCOES_ID'));
                
                if(idsPromocoes.length > 0) {
                    await this.atualizarDatasPromocao(inicio, validade, idsPromocoes);
                }

                Ext.Note('success', 'Datas das promoções atualizadas com sucesso');
                this.onBuscarClick();
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao atualizar datas das promoções');
        }
    },

    atualizarDatasPromocao: async function(inicio, validade, ids) {

        const view = this.getView();

        try {
            
            view.initGauge('Atualizando datas...');

            await SamosUtils.Request.nodeApi({
                url: `/processos/atualizarpromocoes`,
                method: 'GET',
                data: {
                    ids: ids,
                    inicio: inicio,
                    validade: validade
                }
            });

            await SamosUtils.Utils.sleep(500);

            this.onBuscarClick();
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao atualizar datas de inicio/validade');
        }

        view.stopGauge();
    }

});
