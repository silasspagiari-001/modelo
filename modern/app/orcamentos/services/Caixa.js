Ext.define('SamosAdminModern.orcamentos.services.Caixa', {
    alternateClassName: 'Caixa.services.Model',
    singleton: true,

    getStatus: async function(data) {
        const queryStatus = await SamosUtils.Request.nodeApi({
            url: `/caixa`,
            method: 'GET',
            data: {
                empresa: configs.getEmpresa().id,
                emissao: momentTz(data).format('DD/MM/YYYY'),
                incluirDuplicata: configs.getFinanceiros().exibirDuplicataNoCaixa !== false,
                status: 2,
                start: 0,
                limit: 9999999
            }
        });

        if(queryStatus.results.length && queryStatus.results.every(record => record['MOVIMENTOSCAIXA_STATUS'] == 'F')){
            return 'F';
        } else if(queryStatus.results.length){
            return 'A';
        }
    }
});
