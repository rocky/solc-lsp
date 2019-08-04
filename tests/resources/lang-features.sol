/* A mixed bag of contracts that have various language features that we can test gathering
 */
pragma solidity >=0.5.10;
contract ArrayContract {
  uint[] data;
  function test() public {
    data.pop(); // Use of pop built-in function for `array` type
  }
}

contract Interface {
  enum MyEnum { One, Two } // use of enumeration
}

contract EnumContract {
  function test() pure public returns (Interface.MyEnum) {
    return Interface.MyEnum.One;
  }
}

contract BytesContract {
    bytes data;
    function test(uint8 receiver) public {
      receiver = 10;
      data.pop(); // Use of pop built-in function for `bytes` type
    }
}

contract StructContract {
    struct Snapshots {
        uint256[] ids;
    }

    // use of Snapshots type as the target of a mapping
    mapping (address => Snapshots) private _accountBalanceSnapshots;
}
