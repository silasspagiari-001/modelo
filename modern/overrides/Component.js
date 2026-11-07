Ext.define('Overrides.Component', {
    override: 'Ext.Component',

    getMainView: function () {
        return this.up('component[mainView=true]');
    },

    getMainController: function () {
        var mainView = this.getMainView();

        return mainView ? mainView.getController() : undefined;
    },

    getMainViewModel: function () {
        return this.getMainView().getViewModel();
    }
});
