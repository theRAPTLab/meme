# QA List

Oct 17 2019

This is a rough pass at a list of items to QA, mostly focused on basic key functionality.

* It does not cover Admin or Login views.

* It does not address more complex interaction / workflow issues where features might conflict with each other.


===============================================================================
# Admin View

TBD

===============================================================================
# Login Dialog

TBD

===============================================================================
# Model Selection Dialog

* Create a New Model

* Open an existing model in edit mode.

* Open an exsiting model in comment-only mode.


===============================================================================
# Student View
Generally starting from the upper left of the screen.


-------------------------------------------------------------------------------
## ToolsPanel

This is the left sidebar.

### Components

Expand the Components list.

* Hovering over a component list item should highlight the corresponding component

* Hovering over a component list item should show the corresponding component description (If there is one).

* Clicking on a component list item should select it in the model.

* Click the "Add Component" button and add a new component.


### Mechanisms

Expand the Mechanisms list (it should be expanded by default).

* Hovering over a mechanism list item should highlight the corresponding mechanism

* Hovering over a mechanism list item should show the corresponding mechanism description (If there is one).

* Clicking on a mechanism list item should select it in the model.  (Selection is sometimes not visible if it's covered by another mechanism line or component)

* Click the "Add Mechanism" button and add a new mechanism.



-------------------------------------------------------------------------------
## Add Component Dialog

* Cancel -- You should be able to cancel the dialog without adding a component.


-------------------------------------------------------------------------------
## Add Mechanism Dialog

* Preselection -- You should able to first select one component property, click "Add Mechanism" and have the source be automatically populated.

* Set Source / Target -- Any source or target that has not been set should be set when you click on a component.

* Resetable Source / Target -- Clicking on the source/target buttons after they have already been set should put them back in a "Click on Target" state so you can select a different source/target.

* Reverse Direction -- You should be able to reverse the direction of the arrow.  When you click it, the source and target should animate switching.

* Add -- The Add button should only be enabled if both source and target have been set AND you've entered label text.



-------------------------------------------------------------------------------
## Model


### Title Bar

* Model Title -- You should be able change the title.  Go to models list, or log out, and then back in and you should see the revised model name.

* Go to Models Selection -- Clicking on "Model" or "User:Group" (e.g. "BOB:BLUE") should take you to the models list where you can select a different model.

* Click on the Comment button to add a new comment.

* Logout -- Clicking on Logout should take you back to Login screen.

* Help -- Clicking on "?" should open a floating, draggable Help window.

* Help Scroll -- You should be able to see ALL of the text on the help window by scrolling.

* Help Close -- You should be able to click "X" to close the window.


### Model View


#### Components / Properties

* Hover -- Hovering over a component in the model view should highlight the corresponding component item in the Tools Panel components list.

* Drag -- You should able to drag a prop around to a new position.

* Selection -- Clicking a component should select it.

* Make a Property -- You should be able to drag a component into another component to make it a property (child) of the component.

* Prop Selection -- You should able to click on a prop to select it.  When it's selected, the following prop action button should appear: "Delete", 'Edit Component/Property", "Add Property", "Add Comment"

* Delete -- Clicking on Delete should remove the property and any related mechanism, evidence link badges, and children.

* Edit -- You should be able to edit the label and description of components.

* Add Property -- Clicking Add Property should open the Add Compnent/Property dialog.  What you add should be added as a property (child) of the currently selected component.

* Add Comment -- Clicking "Add Comment" should allow you to add a comment to the selected Property.

* View Comment -- For properties that have a comment attached (displayed in the upper right of the property), clicking the comment should open the comment view.


#### Mechanimss

* Hover Areas -- Hover should be triggerable on any part of a mechanism line (but not gap) and label.

* Hover -- Hovering over a mechanism in the model view should highlight the corresponding mechanism item in the Tools Panel mechanisms list.

* Selection -- Clicking a mechansim should select it.

* Labels -- Labels should be displayed in the middle of the mechanism line with a mostly opaque background.

* Evidence Badges -- Any evidence that has been linked to the mechansim should be displaed as a badge, e.g. "2a"

* Add Comment -- With a mechanism selected, clicking the "Add Comment" button action button (bottom of screen) should add a comment.

* View Comment -- Any mechanisms with comments should have a comment button.  Clicking on it should open the comment.


#### Comments

* View Mode -- When a comment is first opened, it should be in view-only mode.

* Author/Group -- New notes should always show the currently logged in author and group.

* Time/Date -- New notes should alwasy show the current time and date.

* Edit Mode -- The exception to view mode is if you explicitly select "Add Comment" -- the comment should then open in edit mode with the cursor in the text field.  

* Set Criteria -- You should be able to select different criteria from the criteria menu.  This should get saved with the note.

* Save -- Clicking "Close" or anywhere outside of the text field should save the note.

* Close -- Clicking close should save the note and close the comment.

* Read Status -- Opening and saving or closing any comment should mark the comment as read by the current author.

* Unread Status -- New comments introduced by another author via the network should appear as unread.

* Delete -- Hovering over the note should show the "Trash Can" icon.  CLicking it should delete the note.

* Comment -- Clicking the "Comment" button should open a new comment reply.

* Comment visibility -- In Edit mode, the "Comment" (reply) button should not be visible.

* No Comments -- Any evidence item or model with no comments should display an outline chat icon.

* Unread Comments -- Any object with unread comments should show a chat icon with text lines.

* Read Comments -- Any object with comments that have been read by the current author should be a solid chat icon.


#### General

* Pan -- Drag any blank model area to pan the model.

* Pan: Tablet -- Drag two fingers to pan the model.

* Zoom: Scrollwheel -- Use the scrollwheel to zoom in and out of the model.

* Zoom: Drag -- For trackpads, drag two fingers up and down to zoom in and out of the model.

* Zoom: Pinch -- For tablets, pinch two fingers up and down to zoom in and out of the model.

* Single Selection -- With one prop already selected, clicking on a second prop should select the second prop and deselect the first.

* Deselect -- With a prop or mech already selected, click on a blank model area to deselect it.

* Dialog Interference -- WIth a prop already selected (and the prop action buttons showing), you should be able to open a new dialog, like Add Mechanism without the prop actions interfering.


## Network / Collaboration

In general, most add, update, and delete operations should be reflected on any other device logged in as the same GROUP.

* Property Add, Update, Delete
* Mechanism Add, Update, Delete
* Evidence Add, Update, Delete
* Comment Add, Update, Delete (individual comments)
  -- New comment added by another user on the network should show up as unread.


-------------------------------------------------------------------------------
## Resource Library

* Collapse Resource Library -- Clicking the ">" in the upper right should hide the Resource Library.  The model should be visible.  The Title bar items should expand to fill the space.

* Expand Resource Library -- Clicking the burger menu icon should expand the resource library.  The Title bar items should contract accordingly.

* Resource Items -- Only the Resource Items selected for the particular classroom should be shown.  You should not see the complete list of resources.

* Open Resource View -- Clicking on a Resource Item should open the Resource View (mostly full screen).

* Resource Item Expand / Collapse -- Clicking on the disclosure triangle should expand and contract the list of evidence associated with the resource.

* Evidence Expanded by default -- Any Resource Item with evidence should be expanded by default to show all of the evidence (there might be a request to reverse this -- e.g. collapsed by default).

* Create Evidence -- Any expanded Resource Item should show a "Create Evidence" button.  Clicking on it should create and expand a new evidence item.


### Resource View

* NOTES -- Teacher-input notes specific to the resource should be displayed here.

* Net logo simulation should be runnable.

* Any pdfs should be scrollable.

* Our Notes -- Any changes to "Our Notes" should be auto-saved.

* Create Evidence -- Clicking "Create Evidence" should add a new evidence item and expand it.

* LINKS -- The number of evidence associated with this resource should be displayed.  

* LINKS Update -- Creating/deleteing evidence should update the LINKS count.

* Set Target -- Clicking "Set Target" on an expanded Evidence Item should close the resource view, open the evidence in the Resource Library and be ready for you to select a component.

* Close -- Clicking "Close" should close the resource view.

See "Evidence" for other functionality.


### Evidence Item

* Expand -- Clicking anywhere except the comment and rating on a collapsed evidence item should expand it.

* Collapse -- Clicking on the disclosure triangle should collapse the evidence item.

* Itemization -- New evidence should automatically be numbered relative to their resource.  e.g. if Resource is "3", then the first evidence is "3a", second is "3b", etc.

* Comment -- Clicking on chat icon should open a comment window.

* View Mode - By default, evidence items open in View Mode.  You can add comments and change the rating, but not edit the description, nor set a new target.  In View Mode "Delete" and "Duplicate" and "Edit" buttons are available for the evidence item.

* Edit Mode -- Clicking "Edit" will put the evidence item into Edit mode.  The "Delete" and "Duplicate" button should disappear in Edit mode.

* Disabled Text Input -- The "Description" field should be disabled by default.  It is enabled when you click "Edit".

* Set Target -- In edit mode, you can click an existing target to set it to "Click on Target" mode, allowing you to select a new target.

* Cancel -- Clicking on Cancel should revert any Description text changes to their previous state.  (It should probably revert target setting to a previous state).  It should then exit Edit mode.

* Set Rating -- Click on the Rating to open the Rating Dialog.  Selecting any rating in the Rating Dialog automatically selects the rating and closes the dialog.

* View Screenshot -- Clicking on the screenshot should open it up in a dialog.

* Delete -- Clicking delete should remove the evidence.

* Duplicate -- Clicking duplicate should create a copy of the evidence with the same description but no target set, and no rating.

* Target Not Set -- Any evidence item target that has not been set should be displayed as a disabled "Target Not Set" button in red in View Mode.

* Set Target -- Any evidence item target that has not been set should be displayed as an enabled "Set Target" button in red in Edit Mode, informating the user that they should click on the button to set the target.  Clicking on the button should turn it into a button that says "Click on Target".  Clicking on a component or mechansim should then set that target and update the button to reflect the selected object.

* Blue Component Target -- Targets set to components are displayed in blue.

* Orange Mech Target -- Targets set to mechanisms are displayed in orange.

