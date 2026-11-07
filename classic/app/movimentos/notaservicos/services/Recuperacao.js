Ext.define('SamosAdmin.movimentos.notaservicos.services.Recuperacao', {
    alternateClassName: 'NotaServicos.services.Recuperacao',
    singleton: true,
    
    salvar: function(notaservicos, servicos){
        const recuperado = Object.assign({}, notaservicos.data);
        const valoresUnicos = [
            'ORDENS_ID_EMPRESAS',
            'ORDENS_ID_DOCUMENTOS'
        ];

        recuperado['ORDENS_SERVICOS'] = servicos.map(servico => servico.data);

        SamosUtils.LocalData.post('ORDENS', valoresUnicos, recuperado);
    },
    
    apagar: function(notaservicos, abaNavegador){
        const filtro = {
            'ORDENS_ID_EMPRESAS':   notaservicos.get('ORDENS_ID_EMPRESAS'),
            'ORDENS_ID_DOCUMENTOS': notaservicos.get('ORDENS_ID_DOCUMENTOS')
        };

        if(abaNavegador) {
            filtro['NAVEGADOR_TAB_ID'] = abaNavegador;
        }

        SamosUtils.LocalData.delete('ORDENS', filtro);
    },
    
    checar: function(form){
        const documento = form.model.get('ORDENS_ID_DOCUMENTOS');
        const filtro = {
            'ORDENS_ID_EMPRESAS':   configs.getEmpresa().id,
            'ORDENS_ID_DOCUMENTOS': documento
        };

        const recuperado = SamosUtils.LocalData.get('ORDENS', filtro);

        if(recuperado && recuperado['ORDENS'] && recuperado['ORDENS'][0]) {
            const view = Ext.create({
                xtype: 'formnotaservicosrecuperacao'
            });

            form.add(view);

            view.getViewModel().set({
                notaservicosRecuperacao: recuperado['ORDENS']
            });
        }
    }
});
