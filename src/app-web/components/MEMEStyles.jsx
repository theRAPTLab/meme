import { green, indigo, orange, red, teal, yellow } from '@material-ui/core/colors';
import { registerMorphableType } from '@svgdotjs/svg.js/src/main';
import { Hidden } from '@material-ui/core';

const m_drawerWidth = 100;
const m_edgeDialogWidth = 750;
const m_primary = indigo[500];
const m_stickynoteIconColor = yellow[800]; // `#ffc904`;
const m_stickynoteColor = yellow[400]; //`#ffe25a`;
const m_systemTextColor = 'rgba(0,0,0,0.35)';
const m_systemLabelTextColor = 'rgba(0,0,0,0.25)';
const m_resourceListWidth = 300;

const styles = theme => {
  return {
    oneEmBefore: {
      marginTop: '1em'
    },
    root: {
      display: 'flex'
    },
    loginBackdrop: {
      backgroundColor: m_primary
    },
    appBar: {
      width: `calc(100% - ${m_drawerWidth}px)`,
      marginLeft: m_drawerWidth
    },
    appBarRight: {
      display: 'inline-flex',
      marginRight: m_resourceListWidth
    },
    drawer: {
      width: m_drawerWidth,
      flexShrink: 0,
      height: '100vh'
    },
    drawerPaper: {
      width: m_drawerWidth
    },
    toolbar: theme.mixins.toolbar,
    content: {
      flexGrow: 1,
      backgroundColor: theme.palette.background.default,
      padding: 0
    },
    view: {
      flex: 1,
      backgroundColor: '#f0f0ff'
    },
    fab: {
      margin: theme.spacing(2)
    },
    projectTitle: {
      color: '#fff'
    },
    edgeButton: {
      backgroundColor: orange[500],
      '&:hover': { backgroundColor: orange[700] }
    },
    edgeDialog: {
      width: m_edgeDialogWidth
    },
    edgeDialogWindowLabel: {
      fontSize: '0.6em',
      color: m_systemTextColor,
      marginBottom: '-10px',
      marginTop: '-1em'
    },
    edgeDialogTextField: {
      color: orange[500]
    },
    edgeDialogPaper: {
      margin: `1em 10em 1em ${m_drawerWidth}px`,
      padding: '1em',
      width: m_edgeDialogWidth,
      position: 'absolute',
      bottom: 0
    },
    edgeDialogInput: {
      display: 'flex',
      height: '3em',
      alignItems: 'baseline'
    },
    propertyDeleteButton: {
      position: 'absolute',
      left: '10%',
      bottom: '30px'
    },
    propertyEditButton: {
      position: 'absolute',
      left: '30%',
      bottom: '20px'
    },
    propertyAddButton: {
      position: 'absolute',
      left: '60%',
      bottom: '20px'
    },
    informationList: {
      width: m_resourceListWidth,
      backgroundColor: teal[50],
      zIndex: 1250 // above drawer, below modal
    },
    resourceListLabel: {
      fontSize: '0.8em',
      color: m_systemTextColor,
      marginBottom: '5px',
      padding: '3px 5px'
    },
    resourceView: {
      marginTop: '1em',
      width: '100%',
      height: '100%'
    },
    resourceViewPaper: {
      width: '99%',
      height: '95%',
      margin: '0 auto',
      padding: '1em',
      backgroundColor: teal[50]
    },
    resourceViewWindowLabel: {
      fontSize: '0.8em',
      color: m_systemTextColor,
      marginBottom: '5px',
      marginRight: theme.spacing(2),
      alignSelf: 'flex-start'
    },
    resourceViewTitle: {
      fontSize: '1em',
      fontWeight: 'normal',
      display: 'flex',
      height: '60px',
      paddingBottom: '10px',
      alignItems: 'center'
    },
    resourceViewAvatar: {
      color: '#366',
      backgroundColor: teal[100],
      marginRight: theme.spacing(1)
    },
    resourceViewLabel: {
      paddingLeft: '0',
      maxWidth: '170px',
      maxHeight: '4em',
      overflow: 'hidden'
    },
    resourceViewCard: {
      height: '50px',
      minWidth: '150px'
    },
    resourceViewCardContent: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'baseline',
      padding: '10px 16px'
    },
    resourceViewLinksBadge: {
      width: '18px',
      height: '18px'
    },
    resourceViewSidebar: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '320px',
      height: '90%',
      paddingLeft: '10px',
      verticalAlign: 'top',
      overflow: 'hidden'
    },
    resourceViewSidebarEvidenceList: {
      display: 'inline-flex',
      backgroundColor: '#c7d7d6',
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '5px',
      verticalAlign: 'top',
      overflowY: 'scroll',
      overflowX: 'hidden'
    },
    resourceExpandButton: {
      width: '40px',
      minWidth: '40px',
      height: '50px',
      padding: '0'
    },
    resourceViewNote: {
      width: '100%',
      marginTop: '0.35em',
      backgroundColor: yellow[50]
    },
    resourceViewCreatebutton: {
      marginBottom: theme.spacing(1),
      width: '100%'
    },
    evidenceBody: {
      fontSize: '1em',
      fontWeight: 'normal',
      display: 'flex'
    },
    evidenceBodyRow: {
      marginTop: '0.25em',
      alignItems: 'center'
    },
    evidenceBodyRowCollapsed: {
      height: '35px',
      marginBottom: '2px',
      alignItems: 'baseline'
    },
    evidenceBodyRatingCollapsed: {
      position: 'relative',
      top: '-30px',
      left: '200px'
    },
    evidenceBodyRowCentered: {
      marginTop: '0.25em',
      alignItems: 'center'
    },
    evidenceBodyRowTop: {
      marginTop: '0.25em',
      alignItems: 'top'
    },
    evidenceWindowLabel: {
      fontSize: '0.6em',
      color: m_systemTextColor,
      marginBottom: '5px'
    },
    evidenceLabelField: {
      flexGrow: '1',
      fontSize: '0.9em',
      lineHeight: '1em',
      height: '30px',
      overflowY: 'auto'
    },
    evidenceLabelFieldExpanded: {
      height: 'auto',
      margin: '0'
    },
    evidenceExpandButton: {
      width: '40px',
      minWidth: '40px',
      height: '20px',
      marginTop: '-5px',
      padding: '0',
      float: 'right'
    },
    evidencePrompt: {
      fontSize: '0.8em',
      lineHeight: '1.1em',
      fontStyle: 'italic',
      margin: '15px 0',
      color: '#999'
    },
    evidenceScreenshotButton: {
      padding: 0,
      justifyContent: 'left'
    },
    evidenceScreenshot: {
      width: '90%',
      margin: '0'
    },
    evidenceBadge: {
      height: '16px',
      width: '16px',
      fontSize: '0.8em',
      fontWeight: 'bold'
    },
    evidenceCloseBtn: {
      flexPosition: ''
    },
    evidenceLink: {
      width: 400,
      margin: '50% auto'
    },
    evidenceLinkPaper: {
      width: '290px',
      height: '70px',
      margin: '0 auto',
      padding: '1px 0 10px 10px',
      backgroundColor: teal[100]
    },
    evidenceLinkPaperExpanded: {
      height: 'auto',
      padding: '10px 0 10px 10px',
      backgroundColor: teal[200]
    },
    iconExpanded: {
      transform: 'rotate(180deg)'
    },
    evidenceLinkAvatar: {
      minWidth: '50px',
      height: '25px',
      fontSize: '0.8em',
      justifyContent: 'left',
      overflow: 'hidden',
      textOverflow: 'clip',
      whiteSpace: 'nowrap',
      lineHeight: '1.8em',
      boxSizing: 'content-box'
    },
    evidenceLinkSourceAvatarWaiting: {
      padding: '0 7px',
      color: red.A700,
      backgroundColor: red[100]
    },
    evidenceLinkSelectButton: {
      height: '25px',
      minWidth: '25px', // override material default min-width 60
      fontSize: '0.8em',
      color: '#fff',
      backgroundColor: red[700]
    },
    evidenceLinkSourcePropAvatarSelected: {
      color: indigo[900],
      backgroundColor: indigo[100],
      padding: '0 7px'
    },
    evidenceLinkSourceMechAvatarSelected: {
      color: orange[900],
      backgroundColor: orange[100],
      padding: '0 7px'
    },
    ratingIconSelected: {
      color: yellow[800]
    },
    ratingIconUnselected: {
      color: 'rgba(0,0,0,0.1)'
    },
    ratingButtonLarge: {
      minWidth: '50px',
      padding: '0'
    },
    ratingButtonSmall: {
      minWidth: '24px',
      padding: '0'
    },
    badge: {
      margin: '8px'
    },
    admPaper: {
      margin: '0 auto',
      padding: '1em'
    },
    admTeacherSelector: {
      minWidth: '100%'
    },
    admResourceListPaper: {
      margin: '0 auto',
      padding: '1em',
      backgroundColor: teal[50]
    },
    stickynotePaper: {
      backgroundColor: m_stickynoteColor,
      position: 'absolute',
      top: '200px',
      left: '300px',
      zIndex: 1500
    },
    stickynoteCard: {
      backgroundColor: 'rgba(255,255,0,0.5)',
      margin: '5px',
      padding: '5px 10px',
      width: '325px'
    },
    stickynoteCardRead: {
      color: m_systemTextColor,
      backgroundColor: m_stickynoteColor,
      margin: '5px',
      padding: '5px 10px',
      width: '325px'
    },
    stickynoteIcon: {
      color: m_stickynoteIconColor
    },
    stickynoteCardAuthor: {
      alignItems: 'baseline',
      flexGrow: '1',
      color: m_systemTextColor,
      lineHeight: '1.1em',
      marginRight: '1em'
    },
    stickynoteCardEditBtn: {
      padding: 0
    },
    stickynoteCardInput: {
      // See boilerplate/src/app-web/components/StickyNoteCard.jsx for local style overrides
      width: '100%',
      overflow: 'hidden' // hide scrollbar
    },
    criteriaSelectorMenu: {
      fontSize: '0.9em',
      padding: '2px 4px'
    },
    stickynoteCardLabel: {
      fontSize: '14px', // match Typograophy subitlte2
      color: m_systemLabelTextColor,
      display: 'inline-flex',
      lineHeight: '1.1em'
    },
    stickynoteCardCriteria: {
      fontSize: '14px', // match Typograophy subitlte2
      display: 'inline-flex'
    }
  };
};
styles.DRAWER_WIDTH = m_drawerWidth;

export default styles;
