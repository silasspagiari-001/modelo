Ext.define('Overrides.app.ViewController', {
    override:'Ext.app.ViewController',

    constructor: function () {
        var i, j;

        this.callParent(arguments);

        //child mixins methods override parent mixins methods
        if(this.mixins) {
            for(i in this.mixins){
                for(j in this.mixins[i].functions) {
                    this[j] = this[j] || this.mixins[i].functions[j];
                }
            }
        }  
    }
});
