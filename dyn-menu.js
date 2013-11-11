function buildTree() {
    tree = new YAHOO.widget.TreeView("treeDiv1");
    tree.setDynamicLoad(loadNodeData, currentIconMode);
    var root = tree.getRoot();
    tree.subscribe("labelClick", storeBacktrace);
    for( var i=0, j=menu_items.length; i<j; ++i ) {
	if( menu_items[i] == null ) continue;
	var tempNode = new YAHOO.widget.MenuNode(menu_items[i], root, false);
	if( ! menu_items[i].dynchild ) tempNode.isLeaf = true;
    }
    tree.draw();

    // expand tree, if required
    root.data.backtrace=window.name;
    window.name="";
    expandTree(root);
}

function storeBacktrace(node) {
    // traverse from node to root to fetch menu expansion path
    var backtrace=node.data.id+" ";
    var root=node.tree.getRoot();
    var p;
    while( root != (p=node.parent) ) {
	backtrace = p.data.id+" "+backtrace;
	node = p;
    };
    window.name = backtrace;
}

function highlightChild(node) {
    var target = unescape(document.location).split(/https?:\/\/[^\/]+/);
    var child_nodes = node.children;
    for (var i=0, j=child_nodes.length; i<j; i++) {
	if( target[1] == child_nodes[i].href ) {
	    child_nodes[i].focus();
	    break;
	}
    }
}

function expandTree(node) {
    var backtrace = node.data.backtrace;
    if( backtrace==null || backtrace.length == 0 ) {
	node.tree.unsubscribe("expandComplete", expandTree);
	highlightChild(node);
	return;
    }
    node.data.backtrace = "";

    var k = backtrace.indexOf(' ');
    if( k < 0 ) return;
    var id = backtrace.substr(0,k);
    backtrace=backtrace.substr(k+1);
    for( var j=node.children.length-1; j>=0; --j ) {
	var child=node.children[j];
	if( child.data.id == id ) {
	    child.expand();
	    if( backtrace.length == 0 ) {
		child.data.highlight_child = 1;
		child.focus();
	    }
	    else {
		child.data.backtrace=backtrace;
		child.tree.subscribe("expandComplete", expandTree);
	    }
	    break;
	}
    }
}

function loadNodeData(node, fnLoadComplete)  {
    var sUrl = node.data.id + ".js";

    //prepare our callback object
    var callback = {
	success: function(oResponse) {
	    var child_nodes = eval("(" + oResponse.responseText + ")");
	    if((child_nodes) && (child_nodes.length)) {
		for (var i=0, j=child_nodes.length; i<j; i++) {
		    if( child_nodes[i] == null ) continue;
		    var tempNode = new YAHOO.widget.MenuNode(child_nodes[i], node, false);
		    if( ! child_nodes[i].dynchild ) tempNode.isLeaf = true;
		}
	    }
	    oResponse.argument.fnLoadComplete();
	    if( oResponse.argument.node.data.highlight_child == 1 ) {
		highlightChild(oResponse.argument.node);
	    }
	},

	failure: function(oResponse) {
	    oResponse.argument.fnLoadComplete();
	},

	argument: {
	    "node": node,
	    "fnLoadComplete": fnLoadComplete
	},

	timeout: 7000
    };
    YAHOO.util.Connect.asyncRequest('GET', sUrl, callback);
}
