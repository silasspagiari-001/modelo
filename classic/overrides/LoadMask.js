Ext.define('Overrides.LoadMask', {
    override: 'Ext.LoadMask',

    isHierarchicallyHidden: function() {
        var child = this,
            hidden = false,
            parent, parentInheritedState;

        for (; (parent = child.ownerCt || child.floatParent); child = parent) {
            //patch
            parentInheritedState = {};//parent.getInherited();
            if (parentInheritedState.hidden) {
                hidden = true;
                break;
            }
            if (child.getInherited().collapseImmune) {
                // The child or one of its ancestors is immune to collapse.
                if (parent.collapsed && !child.collapseImmune) {
                    // If the child's direct parent is collapsed, and the child
                    // itself does not have collapse immunity we know that
                    // the child is not visible.
                    hidden = true;
                    break;
                }
            } else {
                // We have ascended the tree to a point where collapse immunity
                // is not in play.  This means if any ancestor above this point
                // is collapsed, then the component is not visible.
                hidden = !!parentInheritedState.collapsed;
                break;
            }
        }
        return hidden;
    }
});
