Ext.define('SamosAdmin.atualizacao.montagens.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.montagenssearch',

    onAfterConstructor: function(){
        //(usado apenas na pruden aço) Se no config o campo Montagem for o Ordem de precedência do produto
        if( configs.getClientName() == 'prudenaco' && configs.getProdutos().labelMontagem && configs.getProdutos().labelMontagem == 'Ordem' )
        {
            Ext.defer(()=>{
                Ext.$('montagenssearch')[0].setTitle( (configs.getProdutos().labelMontagem && configs.getProdutos().labelMontagem == 'Ordem' ? 'Ordens Produto' : 'Montagens') )
            
                //Troca o nome da coluna descrição
                Ext.$('montagenssearch')[0].down('grid').columns[1].setText( (configs.getProdutos().labelMontagem && configs.getProdutos().labelMontagem == 'Ordem' ? 'Ordem Precedência' : 'Descrição da Montagem') )
                
                //Esconde a coluna valor
                Ext.$('montagenssearch')[0].down('grid').columns[2].hide();

            }, 50, this);
        }
    }
});
