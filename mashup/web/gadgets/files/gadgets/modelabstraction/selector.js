/**
 * Copyright (c) 2010 Christian Wiggert
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

var Selector = function(gadget, viewer, group) {
	this.gadget = gadget;
	this.viewer = viewer;
	this.group = group;
	this.init();
}

Selector.prototype = {
	init : function() {
		if (this.viewer) {
			this.gadget.resetSelection(this.viewer);
			this.gadget.removeMarker(this.viewer, "all");
			this.gadget.greyModel(this.viewer);
			if (this.group != null) {
				this.gadget.undoGrey(this.viewer, this.group.shapes);
				this.gadget.selectShapes(this.viewer, this.group.shapes);
			}
			this.gadget.registerSelectionChanged(this.viewer);
		} else {
			var greyModels = function(viewers){
			
				for (var i = 0; i < viewers.length; i++){
					this.gadget.resetSelection(viewers[i]);
					this.gadget.removeMarker(viewers[i], "all");
					this.gadget.greyModel(viewers[i]);
				}
			};
	
			this.gadget.sendViewers(greyModels, this);
			this.gadget.registerSelectionChanged("all");
		}
		this.gadget.registerRPC("handleSelection", "", "", this.updateSelection, this);
		if (this.group == null) {
			this.group = new Group(this.gadget, prompt("Enter a name for the new group:"));
			this.gadget.addGroup(this.group);
		}
	},
	
	/*
	 * Handles the updated selection in the viewer.
	 */
	updateSelection : function(reply) {
		var parts = reply.split(";");
		if (this.viewer == null) {
			this.setViewer(parts[0]);
		}
		var result = this.group.syncShapes(this.returnShapeIds(parts[1]));
		this.gadget.greyModel(this.viewer);
		this.gadget.undoGrey(this.viewer, this.group.shapes);
		//this.gadget.removeMarker(this.viewer, result['removed']);
		//this.gadget.markShapes(this.viewer, result['added']);
		
	},
	
	/*
	 * Returns a list of resourceIds for the given list of shapes.
	 */
	returnShapeIds : function(shapeString) {
		var shapeArray = shapeString.evalJSON(true);
		var result = [];
		if (shapeArray) {
			for (var i = 0; i < shapeArray.length; i++) {
				result.push(shapeArray[i]["resourceId"]);
			}
		}
		return result;
	},
	
	setViewer : function(viewer) {
		this.gadget.unregisterSelectionChanged();
		this.viewer = viewer;
		this.gadget.setViewer(viewer);
		var unGreyModels = function(viewers, exception) {
			for (var i = 0; i < viewers.length; i++){
				if (viewers[i] != exception) {
					this.gadget.undoGrey(viewers[i], "all");
					this.gadget.removeMarker(viewers[i], "all");
				}
			}
		}
		var setModelInfo = function(info) {
			this.gadget.setModel(info);
			this.group.setModel(info);
		}
		this.gadget.sendViewers(unGreyModels, this, viewer);
		this.gadget.registerSelectionChanged(viewer);
		this.gadget.registerRPC("handleSelection", "", "", this.updateSelection, this);
		this.gadget.sendInfo(viewer, setModelInfo, this);
	},
	
	stopSelection : function() {
		this.gadget.unregisterSelectionChanged();
		var undoGreyModels = function(viewers){
			for (var i = 0; i < viewers.length; i++){
				this.gadget.undoGrey(viewers[i], "all");
			}
		};
		
		this.gadget.sendViewers(undoGreyModels, this);
		if (this.viewer != null)
			this.gadget.resetSelection(this.viewer);
		if (this.group != null) 
			this.group.highlightInViewer();
	}
}