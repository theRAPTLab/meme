/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import UR from '../../../system/ursys';
import { cssur, cssinfo } from '../../modules/console-styles';

const ULINK = UR.NewConnection('nettest');
const ULINK2 = UR.NewConnection('nettest2');

let testLocalCallbackRejection;

function DefineHandlers(comp) {
  const testLocalCallback = comp.RegisterTest('LocalCallbackInvoked');
  //
  ULINK2.Subscribe('MYSTERY', data => {
    data.todos.push(`buy ${ULINK.UADDR()} presents`);
    testLocalCallback.pass();
    return data;
  });

  if (UR.PeerCount() < 2) return;

  const testNetCallbackInvoke = comp.RegisterTest('NetCallbackInvoked');
  testLocalCallbackRejection = comp.RegisterTest('LocalCallbackRejection');

  // this handles network subscriptions only
  // it requires that the remote calls it
  // also both clients need to be refreshed at the same time
  // requires a working PEERCOUNT UPDATE system
  try {
    ULINK2.NetSubscribe('NET:MYSTERY_REMOTE', data => {
      data.todos.push(`remote ${ULINK.UADDR()} call test`);
      if (!data.subLog) data.subLog = [];
      data.subLog.push('NetSubcriber');
      testNetCallbackInvoke.pass();
      // since this test is dependent on another client existing
      // we need to run the completion test again
      comp.DidTestsComplete();
      return data;
    });
  } catch (err) {
    console.log(err);
  }

  ULINK2.Subscribe('MYSTERY_REMOTE', data => {
    if (!data.subLog) data.subLog = [];
    data.subLog.push('LocalSubscriber');
    testLocalCallbackRejection.fail('should not have been called');
  });
}

/**
 * TEST: call server reflect, which adds an element to data.stacks and
 * adds a message in serverSays==='REFLECTING'
 * @param {TestComponent} comp
 */
function ServerReflect(comp) {
  const testServerReflect = comp.RegisterTest('ServerReflect');
  const testServerReflectData = comp.RegisterTest('ServerReflect+Data');

  const timeout = setTimeout(() => {
    testServerReflect.fail('server no response');
  }, 1000);

  ULINK.NetCall('NET:SRV_REFLECT', { stack: ['me'] }).then(data => {
    testServerReflect.pass();
    if (data.serverSays === 'REFLECTING') {
      clearTimeout(timeout);
      testServerReflectData.pass();
    }
  });
}

function LocalCall(comp) {
  const testLocalCall = comp.RegisterTest('Local Callback');

  const timeout = setTimeout(() => {
    testLocalCall.fail('system timeout');
  }, 1000);
  ULINK.LocalCall('MYSTERY', {
    todos: ['take out garbage', 'clean basement'],
    source: 'LocalCall'
  }).then(data => {
    clearTimeout(timeout);
    testLocalCall.pass();
  });
}

function UndefinedLocalCall(comp) {
  const testMissingLocalCall = comp.RegisterTest('BadLocalCall');

  const timeout = setTimeout(() => {
    testMissingLocalCall.fail('unexpected timeout');
  }, 1000);
  ULINK.LocalCall('UnHanDled', {}).then(data => {
    clearTimeout(timeout);
    if (data.error) testMissingLocalCall.pass();
    else testMissingLocalCall.fail('unexpected success');
  });
}

function NetCall(comp) {
  if (UR.PeerCount() < 2) return;
  let testNetCall = comp.RegisterTest('NetCall');
  const testNetCallData = comp.RegisterTest('NetCall+Data');

  const timeout = setTimeout(() => {
    testNetCall.fail('connection timeout');
  }, 1000);
  ULINK.NetCall('NET:MYSTERY_REMOTE', {
    todos: ['take out garbage', 'clean basement'],
    source: 'NetCall'
  }).then(data => {
    clearTimeout(timeout);
    if (data.error) {
      // server returns only an error if couldn't find handler
      testNetCall.fail(`server reports '${data.error}'`);
      return;
    }
    testNetCall.pass(); // the netcall mechanism worked!
    // check for modified data
    if (data.todos.length > 2) {
      testNetCallData.pass();
    } else {
      testNetCallData.fail('data unmodified');
    }
    // check for callback isolation when
    // a subscriber implements both Local and Net versions of a call
    if (testLocalCallbackRejection) {
      if (!data.subLog) testLocalCallbackRejection.fail('missing subLog');
      else if (data.subLog.includes('LocalSubscriber'))
        testLocalCallbackRejection.fail('local sub was called unexpectedly');
      else testLocalCallbackRejection.pass();
    }
  });
}

function GetDB(comp) {
  const testGetDB = comp.RegisterTest('GetDB');

  const timeout = setTimeout(() => {
    testGetDB.fail('timeout');
  }, 1000);
  ULINK.NetCall('NET:SRV_DBGET', {}).then(data => {
    clearTimeout(timeout);
    testGetDB.pass();
  });
}

let reflectorTimeout;
let reflectorWindow;
/*
to test:

*/
function SpawnReflector() {
  switch (window.name) {
    case '':
      const win = window.open(window.location.href, 'meme reflector');
      window.open(window.location.href, 'meme test');
      document.title = 'CLOSE ME';
      setTimeout(() => {
        win.location.reload();
      }, 500);
      setTimeout(() => {
        window.close();
      }, 1500);
      break;
    case 'meme reflector':
      document.title = 'REFLECTOR';
      setTimeout(() => {
        window.close();
      }, 1500);
      break;
    case 'meme test':
      if (document.title !== 'MEME TEST RESULTS') {
        document.title = 'MEME TEST RESULTS';
      }
      window.name = '';
      break;
    default:
      throw Error(`unexpected window name '${window.name}'`);
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let TESTS_COMPLETED = false;
export default {
  DoConstructionTests: comp => {
    SpawnReflector(comp);
    ServerReflect(comp);
    DefineHandlers(comp);
  },
  DoMountTests: comp => {
    LocalCall(comp);
    NetCall(comp);
    UndefinedLocalCall(comp);
    GetDB(comp);
    const timeout = setTimeout(() => {
      if (TESTS_COMPLETED) return;
      if (comp.DidTestsComplete(10)) {
        console.log('TESTS SUCCESS');
        comp.AddTestResult('ALL TESTS', 'PASS');
      } else {
        console.log('TESTS FAIL');
      }
      TESTS_COMPLETED = true;
    }, 3000);
  },
  DoRenderTests: comp => {}
};
