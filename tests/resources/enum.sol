pragma solidity 0.5.10;
contract Interface {
    enum MyEnum { One, Two }
}
contract Impl {
    function test() pure public returns (Interface.MyEnum) {
        return Interface.MyEnum.One;
    }
}
