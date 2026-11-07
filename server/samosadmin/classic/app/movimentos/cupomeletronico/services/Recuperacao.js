Ext.define('SamosAdmin.movimentos.cupomeletronico.services.Recuperacao', {
    alternateClassName: 'CupomEletronico.services.Recuperacao',
    singleton: true,
    
    salvar: function(movimento, produtos){
        const recuperado = Object.assign({}, movimento.data);
        const valoresUnicos = [
            'MOVIMENTOS_ID_EMPRESAS',
            'MOVIMENTOS_ID_DOCUMENTOS'
        ];

        recuperado['MOVIMENTOS_ITENS'] = produtos.map(produto => produto.data);

        SamosUtils.LocalData.post('MOVIMENTOS', valoresUnicos, recuperado);
    },
    
    apagar: function(movimento, abaNavegador){
        const filtro = {
            'MOVIMENTOS_ID_EMPRESAS':   movimento.get('MOVIMENTOS_ID_EMPRESAS'),
            'MOVIMENTOS_ID_DOCUMENTOS': movimento.get('MOVIMENTOS_ID_DOCUMENTOS')
        };

        if(abaNavegador) {
            filtro['NAVEGADOR_TAB_ID'] = abaNavegador;
        }

        SamosUtils.LocalData.delete('MOVIMENTOS', filtro);
    },
    
    checar: function(form){
        const documento = form.model.get('MOVIMENTOS_ID_DOCUMENTOS');
        const filtro = {
            'MOVIMENTOS_ID_EMPRESAS':   configs.getEmpresa().id,
            'MOVIMENTOS_ID_DOCUMENTOS': documento
        };

        const recuperado = SamosUtils.LocalData.get('MOVIMENTOS', filtro);

        if(recuperado && recuperado['MOVIMENTOS'] && recuperado['MOVIMENTOS'][0]) {
            const view = Ext.create({
                xtype: 'formcupomeletronicorecuperacao'
            });

            form.add(view);

            view.getViewModel().set({
                movimentosRecuperacao: recuperado['MOVIMENTOS']
            });
        }
    }
});
